"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBot, verifyTurnstile } from "@/lib/turnstile";
import { layout, sendEmail } from "@/lib/email";
import { notifyNewEvent } from "@/lib/notify";
import { conversationAddress } from "@/lib/inbox";
import { plainToHtml, zonedIso } from "@/lib/events";
import { formatEventWhen } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { ActionState } from "@/components/ui/Form";

async function guard(form: FormData): Promise<string | null> {
  if (isBot(form)) return "ok"; // pretend success for bots
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyTurnstile(form, ip))) return "Please complete the verification check and try again.";
  return null;
}

// ---------------------------------------------------------------------------
// Newsletter (double opt-in)
// ---------------------------------------------------------------------------
export async function subscribe(_: ActionState, form: FormData): Promise<ActionState> {
  const g = await guard(form);
  if (g === "ok") return { ok: "Check your email to confirm." };
  if (g) return { error: g };
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address." };

  const db = createAdminClient();
  const { data: existing } = await db.from("subscribers").select("id, status").eq("site_id", SITE.id).eq("email", email.data).maybeSingle();
  if (existing?.status === "confirmed") return { ok: "You're already subscribed. Look for new jobs every Monday." };

  let id = existing?.id as string | undefined;
  if (!id) {
    const { data, error } = await db
      .from("subscribers")
      .insert({ site_id: SITE.id, email: email.data, status: "pending", source: "website" })
      .select("id")
      .single();
    if (error) return { error: "Something went wrong. Please try again." };
    id = data.id;
  } else if (existing?.status === "unsubscribed") {
    await db.from("subscribers").update({ status: "pending" }).eq("id", id);
  }

  const { data: token } = await db.rpc("create_action_token", { p_purpose: "subscriber_confirm", p_target_id: id, p_ttl: "7 days" });
  const { html, text } = layout({
    heading: "Confirm your Work Hays subscription",
    paragraphs: ["Click below to get new jobs in Hays and western Kansas in your inbox every Monday.", "If you didn't sign up, ignore this email."],
    button: { label: "Confirm subscription", url: `${SITE.url}/link/${token}` },
  });
  await sendEmail({ to: email.data, subject: "Confirm your Work Hays subscription", html, text });
  return { ok: "Almost done! Check your email and click the link to confirm." };
}

// ---------------------------------------------------------------------------
// Public event submissions (always pending until a moderator approves)
// ---------------------------------------------------------------------------
const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Enter the event name").max(200),
    date: z.iso.date({ message: "Choose the event date" }),
    start_time: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]),
    end_time: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]),
    location_name: z.string().trim().min(2, "Where is it?").max(200),
    address: z.string().trim().max(300),
    event_url: z.union([z.literal(""), z.url({ message: "Enter a full web address, starting with https://" })]),
    description: z.string().trim().min(10, "Add a short description (at least 10 characters).").max(5000),
    submitter_name: z.string().trim().min(2, "Enter your name").max(120),
    submitter_email: z.email("Enter a valid email address"),
  })
  .refine((d) => !d.end_time || !d.start_time || d.end_time > d.start_time, { message: "The end time should be after the start time." });

export async function submitEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const g = await guard(form);
  if (g === "ok") return { ok: "Thanks! We'll review your event shortly." };
  if (g) return { error: g };
  const parsed = eventSchema.safeParse(Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const allDay = !d.start_time;

  const db = createAdminClient();
  const { data: created, error } = await db.from("events").insert({
    site_id: SITE.id,
    title: d.title,
    description_html: plainToHtml(d.description),
    starts_at: zonedIso(d.date, d.start_time),
    ends_at: d.end_time ? zonedIso(d.date, d.end_time) : null,
    all_day: allDay,
    location_name: d.location_name,
    address: d.address || null,
    event_url: d.event_url || null,
    submitter_name: d.submitter_name,
    submitter_email: d.submitter_email.toLowerCase(),
    status: "pending",
  }).select("id, starts_at, ends_at").single();
  if (error) return { error: "Something went wrong. Please try again." };
  const when = formatEventWhen(created.starts_at, created.ends_at, allDay);
  await notifyNewEvent({
    eventId: created.id,
    title: d.title,
    when: `${when.date}, ${when.time}`,
    where: d.location_name,
    description: d.description,
    submittedBy: `${d.submitter_name} (${d.submitter_email})`,
  });
  return { ok: "Thanks! A moderator will review your event, usually within a day, and we'll post it once it's approved." };
}

// ---------------------------------------------------------------------------
// Contact form (also used for "Report this listing")
// ---------------------------------------------------------------------------
const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().max(40),
  message: z.string().trim().min(10, "Add a message").max(5000),
});

export async function sendContact(_: ActionState, form: FormData): Promise<ActionState> {
  const g = await guard(form);
  if (g === "ok") return { ok: "Thanks, we got your message." };
  if (g) return { error: g };
  const parsed = contactSchema.safeParse({
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    message: String(form.get("message") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const db = createAdminClient();
  const { data: saved } = await db
    .from("contact_messages")
    .insert({ site_id: SITE.id, name: d.name, email: d.email.toLowerCase(), phone: d.phone || null, message: d.message })
    .select("id, reply_token")
    .single();
  const { data: staff } = await db.from("site_staff").select("profiles(email)").eq("site_id", SITE.id);
  const to = (staff ?? []).map((r) => (r.profiles as unknown as { email: string } | null)?.email).filter((e): e is string => !!e);
  // Staff reply on the website (or to this email, which is relayed through the conversation).
  const convoAddress = saved ? conversationAddress(saved.reply_token) : null;
  const { html, text } = layout({
    heading: `Message from ${d.name}`,
    paragraphs: [d.message, `${d.email}${d.phone ? ` · ${d.phone}` : ""}`],
    button: saved ? { label: "Reply on the website", url: `${SITE.url}/admin/messages/${saved.id}` } : undefined,
    footer: convoAddress
      ? "Reply on the website, or reply to this email and we'll send it to them for you."
      : "Reply on the website to keep the conversation together.",
  });
  await sendEmail({ to, subject: `[${SITE.name}] Contact: ${d.name}`, html, text, replyTo: convoAddress ?? d.email });
  return { ok: "Thanks, we got your message and will get back to you soon." };
}

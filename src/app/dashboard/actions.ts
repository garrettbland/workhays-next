"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";
import { SITE } from "@/lib/site";
import { notifyNewClaim, notifyNewEmployer, sendTeamInvite } from "@/lib/notify";
import type { ActionState } from "@/components/ui/Form";

/** Every action re-checks the session; row-level security in the database is the real gate. */
async function session() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  return { user, supabase: await createClient() };
}

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (v: string) => (v === "" ? null : v);

function refreshPublic(employerId?: string, jobId?: string) {
  updateTag("jobs");
  updateTag("employers");
  if (employerId) updateTag(`employer:${employerId}`);
  if (jobId) updateTag(`job:${jobId}`);
}

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export async function createEmployer(_: ActionState, form: FormData): Promise<ActionState> {
  const { user, supabase } = await session();
  const name = str(form, "name");
  if (name.length < 2) return { error: "Enter your business name." };
  if (name.length > 200) return { error: "That name is too long." };

  const { data: id, error } = await supabase.rpc("create_employer", { p_site_id: SITE.id, p_name: name });
  if (error) return { error: error.message };
  await notifyNewEmployer({ employerId: id as string, name, submittedBy: user.email });
  redirect(`/dashboard/${id}?welcome=1`);
}

export async function claimEmployer(_: ActionState, form: FormData): Promise<ActionState> {
  const { user, supabase } = await session();
  const employerId = str(form, "employer_id");
  const { error } = await supabase.rpc("claim_employer", { p_employer_id: employerId, p_message: optional(str(form, "message")) });
  if (error) return { error: error.message };
  await notifyNewClaim({ employerName: str(form, "employer_name"), requestedBy: user.email });
  return { ok: "Thanks! A moderator will review your claim and email you when it's approved." };
}

const url = z.union([z.literal(""), z.url({ message: "Enter a full web address, starting with https://" })]);
const employerSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name").max(200),
  contact_name: z.string().trim().max(120),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]),
  phone: z.string().trim().max(40),
  website_url: url,
  facebook_url: url,
  instagram_url: url,
  linkedin_url: url,
  description_html: z.string().max(50_000),
});

export async function saveEmployer(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await session();
  const employerId = str(form, "employer_id");
  const raw = Object.fromEntries(
    ["name", "contact_name", "email", "phone", "website_url", "facebook_url", "instagram_url", "linkedin_url", "description_html"].map(
      (k) => [k, str(form, k)],
    ),
  );
  const parsed = employerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const description = sanitizeRichText(d.description_html);

  const { data, error } = await supabase
    .from("employers")
    .update({
      name: d.name,
      contact_name: optional(d.contact_name),
      email: optional(d.email.toLowerCase()),
      phone: optional(d.phone),
      website_url: optional(d.website_url),
      facebook_url: optional(d.facebook_url),
      instagram_url: optional(d.instagram_url),
      linkedin_url: optional(d.linkedin_url),
      description_html: toPlainText(description) ? description : null,
    })
    .eq("id", employerId)
    .select("id");
  if (error) return { error: "Couldn't save your changes. Please try again." };
  if (!data?.length) return { error: "Only owners and admins can edit the business profile." };
  refreshPublic(employerId);
  return { ok: "Saved." };
}

const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function uploadLogo(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await session();
  const employerId = str(form, "employer_id");
  const file = form.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  const ext = LOGO_TYPES[file.type];
  if (!ext) return { error: "Use a PNG, JPG or WebP image." };
  if (file.size > 2 * 1024 * 1024) return { error: "Logos can be up to 2 MB." };

  const path = `employers/${employerId}/logo-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("public-assets").upload(path, file, { contentType: file.type });
  if (upErr) return { error: "Upload failed. Only owners and admins can change the logo." };
  const { error } = await supabase.from("employers").update({ logo_path: path }).eq("id", employerId);
  if (error) return { error: "Couldn't save the logo." };
  refreshPublic(employerId);
  return { ok: "Logo updated." };
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

const money = z.union([z.literal(""), z.coerce.number().min(0).max(10_000_000)]);
const jobSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a job title").max(200),
    job_type: z.enum(["full_time", "part_time", "contract", "temporary", "seasonal", "internship"]),
    industry: z.string().trim().max(80),
    location: z.string().trim().max(120),
    pay_min: money,
    pay_max: money,
    pay_period: z.union([z.literal(""), z.enum(["hour", "week", "month", "year"])]),
    application_url: url,
    application_email: z.union([z.literal(""), z.email("Enter a valid application email")]),
    description_html: z.string().max(100_000),
  })
  .refine((d) => d.application_url || d.application_email, {
    message: "Add a link or an email address where people can apply.",
  })
  .refine((d) => d.pay_min === "" || d.pay_max === "" || Number(d.pay_max) >= Number(d.pay_min), {
    message: "The maximum pay should be more than the minimum.",
  });

export async function saveJob(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await session();
  const employerId = str(form, "employer_id");
  const jobId = str(form, "job_id");
  const intent = str(form, "intent"); // "publish" | "draft" | "save"

  const raw = Object.fromEntries(
    ["title", "job_type", "industry", "location", "pay_min", "pay_max", "pay_period", "application_url", "application_email", "description_html"].map(
      (k) => [k, str(form, k)],
    ),
  );
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const description = sanitizeRichText(d.description_html);
  if (toPlainText(description).length < 30) return { error: "Add a description of at least a couple of sentences." };

  const fields = {
    title: d.title,
    job_type: d.job_type,
    industry: optional(d.industry),
    location: optional(d.location),
    pay_min: d.pay_min === "" ? null : d.pay_min,
    pay_max: d.pay_max === "" ? null : d.pay_max,
    pay_period: d.pay_min === "" && d.pay_max === "" ? null : optional(d.pay_period) ?? "hour",
    application_url: optional(d.application_url),
    application_email: optional(d.application_email.toLowerCase()),
    description_html: description,
    auto_renew: form.get("auto_renew") === "on",
  };

  if (jobId) {
    const update = intent === "publish" ? { ...fields, status: "active" } : fields;
    const { data, error } = await supabase.from("jobs").update(update).eq("id", jobId).select("id");
    if (error) return { error: error.message.includes("approved") ? error.message : "Couldn't save the job. Please try again." };
    if (!data?.length) return { error: "Job not found." };
  } else {
    const { error } = await supabase
      .from("jobs")
      .insert({ ...fields, employer_id: employerId, site_id: SITE.id, status: intent === "publish" ? "active" : "draft" });
    if (error) return { error: error.message.includes("approved") ? error.message : "Couldn't save the job. Please try again." };
  }
  refreshPublic(employerId, jobId || undefined);
  redirect(`/dashboard/${employerId}?saved=${intent === "publish" ? "published" : "saved"}`);
}

export async function renewJob(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.rpc("renew_job", { p_job_id: str(form, "job_id") });
  refreshPublic(str(form, "employer_id"), str(form, "job_id"));
  refresh();
}

export async function renewAllJobs(form: FormData): Promise<void> {
  const { supabase } = await session();
  const ids = form.getAll("job_id").map(String);
  if (ids.length) await supabase.rpc("renew_jobs", { p_job_ids: ids });
  refreshPublic(str(form, "employer_id"));
  refresh();
}

export async function closeJob(form: FormData): Promise<void> {
  const { supabase } = await session();
  const status = str(form, "status") === "archived" ? "archived" : "filled";
  await supabase.rpc("close_job", { p_job_id: str(form, "job_id"), p_status: status });
  refreshPublic(str(form, "employer_id"), str(form, "job_id"));
  refresh();
}

export async function repostJob(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.from("jobs").update({ status: "active" }).eq("id", str(form, "job_id"));
  refreshPublic(str(form, "employer_id"), str(form, "job_id"));
  refresh();
}

export async function setAutoRenew(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.from("jobs").update({ auto_renew: str(form, "on") === "1" }).eq("id", str(form, "job_id"));
  refreshPublic(str(form, "employer_id"), str(form, "job_id"));
  refresh();
}

export async function deleteJob(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.from("jobs").update({ deleted_at: new Date().toISOString(), status: "archived" }).eq("id", str(form, "job_id"));
  refreshPublic(str(form, "employer_id"), str(form, "job_id"));
  redirect(`/dashboard/${str(form, "employer_id")}`);
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function inviteMember(_: ActionState, form: FormData): Promise<ActionState> {
  const { user, supabase } = await session();
  const employerId = str(form, "employer_id");
  const email = str(form, "email").toLowerCase();
  const role = str(form, "role") === "admin" ? "admin" : "member";
  if (!z.email().safeParse(email).success) return { error: "Enter a valid email address." };

  const { data: token, error } = await supabase.rpc("create_employer_invite", {
    p_employer_id: employerId,
    p_email: email,
    p_role: role,
  });
  if (error) return { error: error.message };

  const [{ data: employer }, { data: me }] = await Promise.all([
    supabase.from("employers").select("name").eq("id", employerId).single(),
    supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single(),
  ]);
  const inviter = [me?.first_name, me?.last_name].filter(Boolean).join(" ") || user.email;
  await sendTeamInvite({ email, employerName: employer?.name ?? "a business", invitedBy: inviter, role, token: token as string });
  return { ok: `Invite sent to ${email}.` };
}

export async function resendInvite(form: FormData): Promise<void> {
  await inviteMember(undefined, form);
  refresh();
}

export async function revokeInvite(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.rpc("revoke_employer_invite", { p_invite_id: str(form, "invite_id") });
  refresh();
}

export async function removeMember(form: FormData): Promise<void> {
  const { user, supabase } = await session();
  const employerId = str(form, "employer_id");
  const userId = str(form, "user_id");
  await supabase.rpc("remove_employer_member", { p_employer_id: employerId, p_user_id: userId });
  if (userId === user.id) redirect("/dashboard");
  refresh();
}

export async function changeRole(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.rpc("set_employer_member_role", {
    p_employer_id: str(form, "employer_id"),
    p_user_id: str(form, "user_id"),
    p_role: str(form, "role") === "admin" ? "admin" : "member",
  });
  refresh();
}

export async function transferOwnership(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.rpc("transfer_employer_ownership", {
    p_employer_id: str(form, "employer_id"),
    p_new_owner_id: str(form, "user_id"),
  });
  refresh();
}

export async function respondToInvite(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await session();
  const accept = str(form, "accept") === "1";
  const { data: employerId, error } = await supabase.rpc("respond_to_employer_invite", {
    p_token: str(form, "token"),
    p_accept: accept,
  });
  if (error) return { error: error.message };
  if (accept) redirect(`/dashboard/${employerId}?joined=1`);
  return { ok: "Invite declined. You won't be added to this team." };
}

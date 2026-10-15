import { createAdminClient } from "@/lib/supabase/admin";
import { layout, sendEmail } from "@/lib/email";
import {
  conversationAddress,
  findConversationToken,
  getReceivedEmail,
  htmlToText,
  isAutomated,
  isForThisInbox,
  isPassThrough,
  parseAddress,
  sendConversationReply,
  stripQuoted,
  verifyWebhook,
  type Conversation,
} from "@/lib/inbox";
import { SITE } from "@/lib/site";

/**
 * Resend Inbound webhook (event "email.received"). Set this URL and its signing secret
 * (RESEND_WEBHOOK_SECRET) in Resend → Webhooks. Always answers 200 once the signature is
 * valid so Resend doesn't retry mail we chose to ignore.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("Inbound email is not configured", { status: 503 });
  const body = await req.text();
  if (!verifyWebhook(body, req.headers, secret)) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(body) as { type?: string; data?: { email_id?: string } };
  if (event.type !== "email.received" || !event.data?.email_id) return Response.json({ ignored: true });

  const result = await handleReceived(event.data.email_id);
  return Response.json(result);
}

async function handleReceived(emailId: string) {
  const db = createAdminClient();
  const { count } = await db.from("contact_message_entries").select("id", { count: "exact", head: true }).eq("email_id", emailId);
  if (count) return { duplicate: true };

  const email = await getReceivedEmail(emailId);
  // Resend sends every received email to every webhook on the account. Only handle mail for
  // this site's own inbox domain, so the dev site never answers production mail (or vice versa).
  if (!isForThisInbox([...(email.to ?? []), ...(email.cc ?? []), ...(email.received_for ?? [])])) return { ignored: "other inbox" };
  const headers = email.headers ?? {};
  const from = parseAddress(headers.from ?? headers.From ?? email.from);
  const recipients = [...(email.to ?? []), ...(email.cc ?? []), ...(email.received_for ?? [])];
  const rawText = email.text?.trim() ? email.text : htmlToText(email.html ?? "");
  const text = stripQuoted(rawText).slice(0, 20_000);
  const subject = (email.subject ?? "").slice(0, 300);

  const token = findConversationToken(recipients);
  const { data: convo } = token
    ? await db.from("contact_messages").select("id, site_id, name, email, message, created_at, reply_token, status").eq("reply_token", token).maybeSingle()
    : { data: null };

  // Mail to an address that isn't a conversation
  if (!convo) {
    if (isPassThrough(from.email)) {
      await forwardToStaff(db, SITE.id, from, subject, rawText);
      return { forwarded: true };
    }
    if (isAutomated(from.email, headers)) return { ignored: "automated" };
    return { autoReply: await autoReply(db, SITE.id, from.email) };
  }
  if (convo.status === "spam") return { ignored: "spam" };

  const staff = await staffMembers(db, convo.site_id);
  const staffSender = staff.find((s) => s.email === from.email);

  // A staff member answered the alert email from their own inbox: send it on as a reply.
  if (staffSender) {
    const sent = await sendConversationReply(db, convo as Conversation, { id: staffSender.id, firstName: staffSender.first_name }, text, emailId);
    return { relayed: "ok" in sent };
  }

  if (isAutomated(from.email, headers)) return { ignored: "automated" };

  const attachments = (email.attachments ?? []).map((a) => ({ id: a.id, filename: a.filename, content_type: a.content_type, size: a.size ?? null }));
  const { error } = await db.from("contact_message_entries").insert({
    message_id: convo.id,
    site_id: convo.site_id,
    direction: "in",
    from_email: from.email,
    from_name: from.name,
    body_text: text,
    email_id: emailId,
    rfc_message_id: email.message_id,
    attachments,
  });
  if (error) {
    if (error.code === "23505") return { duplicate: true };
    throw new Error(error.message);
  }
  await db.from("contact_messages").update({ status: "new", last_activity_at: new Date().toISOString() }).eq("id", convo.id);

  const { html, text: alertText } = layout({
    heading: `New reply from ${from.name || convo.name}`,
    paragraphs: [text.slice(0, 1500), ...(attachments.length ? [`${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`] : [])],
    button: { label: "Open the conversation", url: `${SITE.url}/admin/messages/${convo.id}` },
    footer: "Reply on the website, or reply to this email and we'll send it to them for you.",
  });
  await sendEmail({
    to: staff.map((s) => s.email),
    subject: `[${SITE.name}] Reply from ${from.name || convo.name}`,
    html,
    text: alertText,
    replyTo: conversationAddress(convo.reply_token) ?? undefined,
  });
  return { stored: true };
}

async function staffMembers(db: ReturnType<typeof createAdminClient>, siteId: string) {
  const { data } = await db.from("site_staff").select("profile:profiles(id, email, first_name)").eq("site_id", siteId);
  return (data ?? [])
    .map((r) => r.profile as unknown as { id: string; email: string; first_name: string | null } | null)
    .filter((p): p is { id: string; email: string; first_name: string | null } => !!p)
    .map((p) => ({ ...p, email: p.email.toLowerCase() }));
}

/** "We don't read this inbox" — at most once a day per sender. */
async function autoReply(db: ReturnType<typeof createAdminClient>, siteId: string, to: string): Promise<"sent" | "skipped"> {
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const { data: recent } = await db
    .from("inbound_auto_replies")
    .select("email")
    .eq("site_id", siteId)
    .eq("email", to)
    .gt("last_sent_at", dayAgo)
    .maybeSingle();
  if (recent) return "skipped";
  await db.from("inbound_auto_replies").upsert({ site_id: siteId, email: to, last_sent_at: new Date().toISOString() });
  const { html, text } = layout({
    heading: `Please contact ${SITE.name} through our website`,
    paragraphs: [
      "Thanks for reaching out. This email address doesn't accept new messages.",
      "Send us a note with the contact form and we'll get back to you there.",
    ],
    button: { label: "Contact us", url: `${SITE.url}/contact` },
  });
  await sendEmail({
    to,
    subject: `Please contact ${SITE.name} through our website`,
    html,
    text,
    headers: { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" },
  });
  return "sent";
}

/** Service emails (e.g. a forwarding confirmation from Cloudflare) go to staff as-is. */
async function forwardToStaff(
  db: ReturnType<typeof createAdminClient>,
  siteId: string,
  from: { email: string; name: string | null },
  subject: string,
  body: string,
) {
  const staff = await staffMembers(db, siteId);
  const { html, text } = layout({
    heading: subject || "(no subject)",
    paragraphs: [`From ${from.name ? `${from.name} <${from.email}>` : from.email}, sent to the ${SITE.name} inbox address.`, body.slice(0, 5000)],
  });
  await sendEmail({ to: staff.map((s) => s.email), subject: `[${SITE.name}] Forwarded: ${subject}`, html, text });
}

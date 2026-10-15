import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { formatLongDate } from "@/lib/format";
import { SITE } from "@/lib/site";

/**
 * The admin message inbox.
 *
 * Every contact message has a private reply address, c-<reply_token>@<INBOUND_EMAIL_DOMAIN>.
 * Replies sent from the admin use it as Reply-To, so when the person answers from their email,
 * Resend receives it and posts to /api/inbound, which adds it to the same conversation.
 * Mail to any other address on that domain gets a "please use the contact form" auto-reply.
 */

export const inboundDomain = () => (process.env.INBOUND_EMAIL_DOMAIN ?? "").trim().toLowerCase() || null;

export function conversationAddress(token: string): string | null {
  const domain = inboundDomain();
  return domain ? `c-${token}@${domain}` : null;
}

/** "Pat Smith <pat@example.com>" → { email, name } */
export function parseAddress(value: string): { email: string; name: string | null } {
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { email: m[2].trim().toLowerCase(), name: m[1].trim() || null };
  return { email: value.trim().toLowerCase(), name: null };
}

/** True if any recipient is on this site's inbound domain (dev and prod share one Resend account). */
export function isForThisInbox(addresses: string[]): boolean {
  const domain = inboundDomain();
  return !!domain && addresses.some((a) => parseAddress(a).email.endsWith(`@${domain}`));
}

/** Finds the conversation token among the recipient addresses, if any. */
export function findConversationToken(addresses: string[]): string | null {
  const domain = inboundDomain();
  if (!domain) return null;
  for (const a of addresses) {
    const { email } = parseAddress(a);
    const m = email.match(/^c-([0-9a-f]{24})@(.+)$/);
    if (m && m[2] === domain) return m[1];
  }
  return null;
}

/** Keeps only what the person wrote: drops the quoted earlier messages most mail apps add. */
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = `${line} ${lines[i + 1] ?? ""}`;
    if (
      /^On .+wrote:\s*$/.test(line) || // Gmail / Apple Mail
      /^On .{10,200}wrote:\s*$/.test(next) || // same, wrapped onto two lines
      /^-{2,}\s*Original Message\s*-{2,}/i.test(line) || // Outlook
      /^_{10,}\s*$/.test(line) || // Outlook web
      (/^From: /.test(line) && /^(Sent|Date): /.test(lines[i + 1] ?? "")) ||
      /^Sent from my (iPhone|iPad|Android|Samsung)/i.test(line)
    ) {
      break;
    }
    out.push(line);
  }
  while (out.length && (out[out.length - 1].trim() === "" || out[out.length - 1].startsWith(">"))) out.pop();
  const result = out.filter((l) => !l.startsWith(">")).join("\n").trim();
  return result || text.trim();
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Bounces, out-of-office replies and mailing lists, which must never get an auto-reply. */
export function isAutomated(from: string, headers: Record<string, string>): boolean {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  if (h["auto-submitted"] && h["auto-submitted"] !== "no") return true;
  if (/(bulk|junk|list|auto_reply)/.test(h["precedence"] ?? "")) return true;
  if (h["list-id"] || h["list-unsubscribe"] || h["x-autoreply"] || h["x-autorespond"] || h["x-auto-response-suppress"]) return true;
  return /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounces?)[@+.-]/i.test(from);
}

/** Senders whose mail is passed to staff instead of auto-replied (e.g. forwarding confirmations). */
const PASS_THROUGH = [/(^|\.)cloudflare\.com$/i, /(^|\.)resend\.(com|dev)$/i];
export const isPassThrough = (email: string) => PASS_THROUGH.some((re) => re.test(email.split("@")[1] ?? ""));

// ---------------------------------------------------------------------------
// Resend API
// ---------------------------------------------------------------------------

/** Checks a Resend (Svix) webhook signature. */
export function verifyWebhook(body: string, headers: Headers, secret: string, now = Date.now()): boolean {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigs = headers.get("svix-signature");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 5 * 60) return false; // replay protection
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  cc?: string[] | null;
  subject: string | null;
  text: string | null;
  html: string | null;
  headers: Record<string, string> | null;
  message_id: string | null;
  received_for?: string[] | null;
  attachments?: { id: string; filename: string; content_type: string; size?: number }[] | null;
};

const API = process.env.RESEND_API_BASE ?? "https://api.resend.com";

async function resendGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}` } });
  if (!res.ok) throw new Error(`Resend ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const getReceivedEmail = (id: string) => resendGet<ReceivedEmail>(`/emails/receiving/${encodeURIComponent(id)}`);

export async function getAttachmentUrl(emailId: string, attachmentId: string): Promise<string | null> {
  const list = await resendGet<{ data: { id: string; download_url: string }[] }>(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
  );
  return list.data.find((a) => a.id === attachmentId)?.download_url ?? null;
}

// ---------------------------------------------------------------------------
// Sending a reply in a conversation
// ---------------------------------------------------------------------------

export type Conversation = {
  id: string;
  site_id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  reply_token: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails a staff reply to the person and records it. `db` is either the staff member's own
 * client (admin page; RLS checks they're staff) or the service client (reply relayed by email).
 */
export async function sendConversationReply(
  db: SupabaseClient,
  convo: Conversation,
  staff: { id: string; firstName: string | null },
  body: string,
  /** When relaying a staff member's email reply: Resend's id for it, so a webhook retry can't send twice. */
  sourceEmailId?: string,
): Promise<{ ok: true } | { error: string }> {
  const { data: last } = await db
    .from("contact_message_entries")
    .select("direction, body_text, created_at, rfc_message_id, from_name")
    .eq("message_id", convo.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const lastIn = (last ?? []).find((e) => e.direction === "in");
  const quoted = lastIn
    ? { when: lastIn.created_at as string, who: (lastIn.from_name as string | null) || convo.name, text: lastIn.body_text as string }
    : { when: convo.created_at, who: convo.name, text: convo.message };
  const threadIds = (last ?? []).map((e) => e.rfc_message_id).filter((v): v is string => !!v).reverse();

  const intro = `On ${formatLongDate(quoted.when)}, ${quoted.who} wrote:`;
  const text = `${body}\n\n— ${staff.firstName ? `${staff.firstName}, ` : ""}${SITE.name}\n${SITE.url}\n\n${intro}\n${quoted.text
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")}`;
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#111">
${body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}
<p style="margin:16px 0 0;color:#5b5b5b">— ${esc(staff.firstName ? `${staff.firstName}, ` : "")}${esc(SITE.name)}<br><a href="${SITE.url}" style="color:#5b5b5b">${esc(SITE.url.replace(/^https?:\/\//, ""))}</a></p>
<p style="margin:24px 0 6px;color:#5b5b5b;font-size:13px">${esc(intro)}</p>
<blockquote style="margin:0;padding-left:12px;border-left:3px solid #e3e3e3;color:#5b5b5b;font-size:14px">${esc(quoted.text).replace(/\n/g, "<br>")}</blockquote>
</body></html>`;

  const replyTo = conversationAddress(convo.reply_token) ?? undefined;
  const sent = await sendEmail({
    to: convo.email,
    subject: `Re: Your message to ${SITE.name}`,
    html,
    text,
    replyTo,
    fromName: staff.firstName ? `${staff.firstName} at ${SITE.name}` : SITE.name,
    headers: threadIds.length
      ? { "In-Reply-To": threadIds[threadIds.length - 1], References: threadIds.join(" ") }
      : undefined,
  });
  if (!sent) return { error: "The email didn't send. Please try again in a minute." };

  const now = new Date().toISOString();
  const { error } = await db.from("contact_message_entries").insert({
    message_id: convo.id,
    site_id: convo.site_id,
    direction: "out",
    from_email: (process.env.EMAIL_FROM ?? "hello@mail.workhays.com").match(/<([^>]+)>/)?.[1] ?? "hello@mail.workhays.com",
    from_name: staff.firstName ? `${staff.firstName} at ${SITE.name}` : SITE.name,
    body_text: body,
    staff_user_id: staff.id,
    email_id: sourceEmailId ?? null,
  });
  if (error) return { error: `Sent, but couldn't save it here: ${error.message}` };
  await db.from("contact_messages").update({ status: "handled", last_activity_at: now }).eq("id", convo.id);
  return { ok: true };
}

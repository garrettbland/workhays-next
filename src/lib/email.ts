import "server-only";
import { SITE } from "@/lib/site";

export type Email = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

const FROM = process.env.EMAIL_FROM || "Work Hays <hello@mail.workhays.com>";

function payload(email: Email) {
  return {
    from: FROM,
    to: Array.isArray(email.to) ? email.to : [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    reply_to: email.replyTo,
    headers: email.headers,
  };
}

/**
 * Sends through Resend's HTTP API. Without RESEND_API_KEY (local dev), emails are printed
 * to the server log instead, so every flow still works end to end.
 */
export async function sendEmail(email: Email): Promise<void> {
  const to = Array.isArray(email.to) ? email.to : [email.to];
  if (to.length === 0) return;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`\n[email:dev] To: ${to.join(", ")}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload(email)),
  });
  if (!res.ok) {
    // Never fail the user's action because an email didn't send; log for follow-up.
    console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
  }
}

/** Many individual emails (e.g. the weekly digest), 100 per Resend batch request. */
export async function sendBatch(emails: Email[]): Promise<{ sent: number; failed: number }> {
  const key = process.env.RESEND_API_KEY;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    if (!key) {
      for (const e of chunk) console.info(`\n[email:dev] To: ${[e.to].flat().join(", ")}\nSubject: ${e.subject}\n\n${e.text}\n`);
      sent += chunk.length;
      continue;
    }
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(chunk.map(payload)),
    });
    if (res.ok) sent += chunk.length;
    else {
      failed += chunk.length;
      console.error(`[email] Resend batch error ${res.status}: ${await res.text()}`);
    }
    if (i + 100 < emails.length) await new Promise((r) => setTimeout(r, 600)); // stay under the rate limit
  }
  return { sent, failed };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailItem = { title: string; detail?: string; url?: string; links?: { label: string; url: string }[] };

/** Plain email layout matching the site (black and white, one gold button). */
export function layout(opts: {
  heading: string;
  paragraphs: string[];
  items?: EmailItem[];
  button?: { label: string; url: string };
  after?: string[];
  footer?: string;
  unsubscribeUrl?: string;
}) {
  const para = (t: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#111">${esc(t)}</p>`;
  const items = (opts.items ?? [])
    .map((it) => {
      const title = it.url
        ? `<a href="${esc(it.url)}" style="color:#111;font-weight:700;text-decoration:none">${esc(it.title)}</a>`
        : `<strong>${esc(it.title)}</strong>`;
      const links = (it.links ?? [])
        .map((l, i) => `<a href="${esc(l.url)}" style="color:${i === 0 ? "#8a5a00" : "#111"};font-weight:600">${esc(l.label)}</a>`)
        .join(" &nbsp;·&nbsp; ");
      return `<tr><td style="padding:14px 0;border-bottom:1px solid #e3e3e3;font-size:16px;line-height:1.4">${title}${
        it.detail ? `<br><span style="color:#5b5b5b;font-size:14px">${esc(it.detail)}</span>` : ""
      }${links ? `<br><span style="font-size:15px;line-height:2">${links}</span>` : ""}</td></tr>`;
    })
    .join("");
  const table = items ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #111;margin:8px 0 20px">${items}</table>` : "";
  const btn = opts.button
    ? `<p style="margin:24px 0"><a href="${esc(opts.button.url)}" style="background:#8a5a00;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;display:inline-block">${esc(opts.button.label)}</a></p>`
    : "";
  const footer = esc(opts.footer ?? `${SITE.name} · ${SITE.url.replace(/^https?:\/\//, "")}`);
  const unsub = opts.unsubscribeUrl ? ` · <a href="${esc(opts.unsubscribeUrl)}" style="color:#5b5b5b">Unsubscribe</a>` : "";

  const html = `<!doctype html><html><body style="margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-weight:800;letter-spacing:.08em;font-size:14px">WORK HAYS</p>
<h1 style="margin:0 0 16px;font-size:22px;color:#111">${esc(opts.heading)}</h1>${opts.paragraphs.map(para).join("")}${table}${btn}${(opts.after ?? []).map(para).join("")}
<p style="margin:32px 0 0;font-size:13px;color:#5b5b5b;border-top:1px solid #e3e3e3;padding-top:16px">${footer}${unsub}</p>
</div></body></html>`;

  const text = [
    opts.heading,
    "",
    ...opts.paragraphs,
    ...(opts.items ?? []).flatMap((it) => [
      "",
      `- ${it.title}${it.detail ? ` (${it.detail})` : ""}`,
      ...(it.url ? [`  ${it.url}`] : []),
      ...(it.links ?? []).map((l) => `  ${l.label}: ${l.url}`),
    ]),
    ...(opts.button ? ["", `${opts.button.label}: ${opts.button.url}`] : []),
    ...(opts.after?.length ? ["", ...opts.after] : []),
    ...(opts.unsubscribeUrl ? ["", `Unsubscribe: ${opts.unsubscribeUrl}`] : []),
  ].join("\n");
  return { html, text };
}

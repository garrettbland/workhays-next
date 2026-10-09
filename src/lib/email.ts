import "server-only";
import { SITE } from "@/lib/site";

type Email = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };

const FROM = process.env.EMAIL_FROM || "Work Hays <hello@mail.workhays.com>";

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
    body: JSON.stringify({ from: FROM, to, subject: email.subject, html: email.html, text: email.text, reply_to: email.replyTo }),
  });
  if (!res.ok) {
    // Never fail the user's action because an email didn't send; log for follow-up.
    console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal, plain email layout that matches the site (black/white, one gold button). */
export function layout(opts: { heading: string; paragraphs: string[]; button?: { label: string; url: string }; footer?: string }) {
  const p = opts.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#111">${esc(t)}</p>`).join("");
  const btn = opts.button
    ? `<p style="margin:24px 0"><a href="${esc(opts.button.url)}" style="background:#8a5a00;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;display:inline-block">${esc(opts.button.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-weight:800;letter-spacing:.08em;font-size:14px">WORK HAYS</p>
<h1 style="margin:0 0 16px;font-size:22px;color:#111">${esc(opts.heading)}</h1>${p}${btn}
<p style="margin:32px 0 0;font-size:13px;color:#5b5b5b;border-top:1px solid #e3e3e3;padding-top:16px">${esc(opts.footer ?? `${SITE.name} · ${SITE.url.replace(/^https?:\/\//, "")}`)}</p>
</div></body></html>`;
  const text = [opts.heading, "", ...opts.paragraphs, ...(opts.button ? ["", `${opts.button.label}: ${opts.button.url}`] : [])].join("\n");
  return { html, text };
}

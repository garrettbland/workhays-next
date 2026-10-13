import "server-only";

/**
 * Verifies a Cloudflare Turnstile token for public forms that don't go through Supabase Auth.
 * With no TURNSTILE_SECRET_KEY (local dev), verification is skipped.
 */
export async function verifyTurnstile(form: FormData, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return data.success === true;
}

/** Hidden field real people never fill in. */
export function isBot(form: FormData): boolean {
  return String(form.get("website_hp") ?? "") !== "";
}

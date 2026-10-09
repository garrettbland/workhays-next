"use client";

import Script from "next/script";

/** Cloudflare Turnstile. Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 *  The token lands in the form as "cf-turnstile-response"; Supabase Auth verifies it. */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
    </>
  );
}

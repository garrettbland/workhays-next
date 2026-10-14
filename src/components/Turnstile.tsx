"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loader ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile failed to load")));
    s.onerror = () => {
      loader = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

/**
 * Cloudflare Turnstile, rendered explicitly so React owns the DOM (no hydration clashes).
 * The token goes into a React-controlled hidden input named "cf-turnstile-response", which
 * survives React's automatic form reset. Tokens are single-use, so pass the form's action
 * state as `resetKey`: each time a submit comes back, the widget fetches a fresh token.
 * Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 */
export function Turnstile({ resetKey, compact = false }: { resetKey?: unknown; compact?: boolean }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!siteKey || !box.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !box.current || widget.current) return;
        widget.current = api.render(box.current, {
          sitekey: siteKey,
          theme: "light",
          // The small footer form only shows the widget if Cloudflare needs the visitor to click.
          appearance: compact ? "interaction-only" : "always",
          "response-field": false,
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey, compact]);

  // A submit used up the token: get a new one for the next try.
  useEffect(() => {
    if (resetKey === undefined || !widget.current || !window.turnstile) return;
    setToken("");
    window.turnstile.reset(widget.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return (
    <>
      <div ref={box} className={compact ? "" : "min-h-[65px]"} />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </>
  );
}

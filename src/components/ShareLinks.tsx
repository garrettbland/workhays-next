"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/** Share buttons: the phone's share sheet when there is one, plus Facebook, email and copy link. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(noop, () => "share" in navigator, () => false);
  const enc = encodeURIComponent;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }
  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* closed the share sheet */
    }
  }
  const link = "font-semibold underline underline-offset-[3px] hover:text-gold";
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
      <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Share</span>
      {canShare && (
        <button type="button" onClick={share} className={link}>Share…</button>
      )}
      <a className={link} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <a className={link} href={`mailto:?subject=${enc(title)}&body=${enc(url)}`}>Email</a>
      <button type="button" onClick={copy} className={link} aria-live="polite">{copied ? "Link copied" : "Copy link"}</button>
    </div>
  );
}

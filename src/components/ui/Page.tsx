import type { ReactNode } from "react";

export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <main className={`mx-auto w-full px-6 pb-20 pt-12 ${narrow ? "max-w-[520px]" : "max-w-[1120px]"}`}>{children}</main>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8 border-b-[3px] border-ink pb-6">
      <h1 className="condensed text-[36px] sm:text-[44px]">{children}</h1>
      {sub && <p className="mt-3 text-[16px] text-body">{sub}</p>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "good" | "bad" }) {
  const t = {
    neutral: "bg-wash text-body",
    gold: "bg-gold-tint text-gold",
    good: "bg-[#e9f4ec] text-[#1f5f32]",
    bad: "bg-[#fdf2f2] text-[#7a1616]",
  }[tone];
  return <span className={`inline-block px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] ${t}`}>{children}</span>;
}

export function Loading() {
  return <div className="h-40 animate-pulse bg-wash" aria-label="Loading" />;
}

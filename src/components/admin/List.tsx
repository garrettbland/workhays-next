import Link from "next/link";
import type { ReactNode } from "react";
import { PAGE_SIZE } from "@/lib/admin";

/** Search box + status filter. A plain GET form, so filters live in the URL and can be bookmarked. */
export function Toolbar({
  q,
  status,
  statuses,
  placeholder,
  extra,
}: {
  q: string;
  status: string;
  statuses: { value: string; label: string }[];
  placeholder: string;
  extra?: ReactNode;
}) {
  return (
    <form className="mb-6 flex flex-wrap items-end gap-3" role="search">
      <label className="flex min-w-0 flex-[1_1_260px] flex-col gap-1 text-[13px] font-semibold">
        Search
        <input name="q" defaultValue={q} placeholder={placeholder} className="h-11 border-[1.5px] border-ink px-3 text-[15px] font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-[13px] font-semibold">
        Status
        <select name="status" defaultValue={status} className="h-11 border-[1.5px] border-ink bg-paper px-3 text-[15px] font-normal">
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      {extra}
      <button type="submit" className="h-11 bg-ink px-5 font-semibold text-white">Filter</button>
    </form>
  );
}

export function ResultCount({ count, page }: { count: number; page: number }) {
  const start = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(count, page * PAGE_SIZE);
  return <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">{count === 0 ? "No results" : `${start}–${end} of ${count.toLocaleString()}`}</p>;
}

export function Pager({ count, page, params }: { count: number; page: number; params: Record<string, string> }) {
  const last = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (last === 1) return null;
  const href = (p: number) => `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(p) })}`;
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center gap-6 font-semibold">
      {page > 1 ? <Link href={href(page - 1)} className="underline underline-offset-[3px]">← Previous</Link> : <span className="text-muted">← Previous</span>}
      <span className="font-mono text-[13px] text-muted">Page {page} of {last}</span>
      {page < last ? <Link href={href(page + 1)} className="underline underline-offset-[3px]">Next →</Link> : <span className="text-muted">Next →</span>}
    </nav>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b-[3px] border-ink">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const td = "border-b border-line py-3 pr-4 align-top";

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-0 border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">{children}</h2>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    ["approved", "active", "confirmed", "handled"].includes(status) ? "bg-[#e9f4ec] text-[#1f5f32]"
    : ["pending", "draft", "new"].includes(status) ? "bg-gold-tint text-gold"
    : ["denied", "rejected", "suspended", "spam"].includes(status) ? "bg-[#fdf2f2] text-[#7a1616]"
    : "bg-wash text-body";
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] ${tone}`}>{status}</span>;
}

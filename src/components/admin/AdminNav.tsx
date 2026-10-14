"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Review" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/employers", label: "Employers" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/ads", label: "Ads" },
];

export function AdminNav() {
  return <AdminNavLinks path={usePathname()} />;
}

/** Same links without knowing the current page (shown while the page streams in). */
export function AdminNavLinks({ path }: { path: string | null }) {
  return (
    <nav aria-label="Admin" className="mt-4 flex gap-x-6 gap-y-2 overflow-x-auto border-b-[3px] border-ink text-[15px] font-semibold">
      {TABS.map((t) => {
        const active = !!path && (t.href === "/admin" ? path === "/admin" : path.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-[3px] shrink-0 border-b-[3px] pb-3 ${active ? "border-gold text-ink" : "border-transparent text-body hover:text-gold"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

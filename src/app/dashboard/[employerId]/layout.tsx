import { Suspense } from "react";
import Link from "next/link";
import { getMyEmployer } from "@/lib/dashboard";
import { Badge } from "@/components/ui/Page";

export default function EmployerLayout({ children, params }: LayoutProps<"/dashboard/[employerId]">) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <Suspense fallback={<div className="h-28 animate-pulse bg-wash" />}>
        <Header params={params} />
      </Suspense>
      {children}
    </main>
  );
}

async function Header({ params }: Pick<LayoutProps<"/dashboard/[employerId]">, "params">) {
  const { employerId } = await params;
  const { employer, canManage } = await getMyEmployer(employerId, `/dashboard/${employerId}`);
  const base = `/dashboard/${employer.id}`;
  const tabs = [
    { href: base, label: "Jobs" },
    { href: `${base}/events`, label: "Events" },
    { href: `${base}/profile`, label: "Business profile" },
    { href: `${base}/team`, label: "Team" },
  ];
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[13px] text-muted">
        <Link href="/dashboard">← All businesses</Link>
        <span className="flex gap-4">
          {employer.status === "approved" && <Link href={`/employers/${employer.id}`}>View public page ↗</Link>}
          <Link href="/account">Account</Link>
          <form action="/sign-out" method="post"><button type="submit" className="hover:text-gold">Sign out</button></form>
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="condensed text-[34px] sm:text-[44px]">{employer.name}</h1>
        {employer.status !== "approved" && (
          <Badge tone={employer.status === "pending" ? "gold" : "bad"}>
            {employer.status === "pending" ? "Waiting for approval" : employer.status}
          </Badge>
        )}
      </div>
      {employer.status === "pending" && (
        <p className="mt-4 border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
          Our moderators have been notified and usually approve new businesses within a day. You can write job drafts now.
          They can be published as soon as you&apos;re approved{canManage ? ", so fill out your business profile in the meantime" : ""}.
        </p>
      )}
      {employer.status === "denied" && (
        <p className="mt-4 border-l-[3px] border-[#9b1c1c] bg-[#fdf2f2] px-4 py-3 text-[15px]">
          This business wasn&apos;t approved{employer.status_reason ? `: ${employer.status_reason}` : "."} Reply to the email we sent if you think this is a mistake.
        </p>
      )}
      <nav aria-label="Business" className="mt-6 flex gap-6 border-b-[3px] border-ink text-[15px] font-semibold">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="pb-3">{t.label}</Link>
        ))}
      </nav>
    </header>
  );
}

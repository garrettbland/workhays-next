import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewEmployer, reviewEvent } from "@/app/admin/actions";
import { formatEventTime, formatShortDate } from "@/lib/format";
import { personName } from "@/lib/admin";
import { toPlainText } from "@/lib/sanitize";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { SectionTitle } from "@/components/admin/List";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Queue />
    </Suspense>
  );
}

type Person = { first_name: string | null; last_name: string | null; email: string } | null;

async function Queue() {
  const staff = await requireStaff("/admin");
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [employers, events, liveJobs, approvedEmployers, upcoming, subscribers, messages] = await Promise.all([
    supabase
      .from("employers")
      .select("id, name, email, website_url, created_at, members:employer_members(role, profile:profiles!employer_members_user_id_fkey(first_name, last_name, email))")
      .eq("site_id", SITE.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("events")
      .select("id, title, description_html, starts_at, all_day, location_name, submitter_name, submitter_email, created_at")
      .eq("site_id", SITE.id)
      .eq("status", "pending")
      .is("deleted_at", null)
      .order("created_at"),
    supabase.from("job_listings").select("id", head).eq("site_id", SITE.id),
    supabase.from("employers").select("id", head).eq("site_id", SITE.id).eq("status", "approved"),
    supabase.from("upcoming_events").select("id", head).eq("site_id", SITE.id),
    supabase.from("subscribers").select("id", head).eq("site_id", SITE.id).eq("status", "confirmed"),
    supabase.from("contact_messages").select("id", head).eq("site_id", SITE.id).eq("status", "new"),
  ]);
  const err = employers.error ?? events.error;
  if (err) throw new Error(`Admin queue failed to load: ${err.message}`);

  const stats = [
    { label: "Live jobs", value: liveJobs.count, href: "/admin/jobs" },
    { label: "Businesses", value: approvedEmployers.count, href: "/admin/employers" },
    { label: "Upcoming events", value: upcoming.count, href: "/admin/events" },
    { label: "Subscribers", value: subscribers.count, href: "/admin/subscribers" },
    { label: "New messages", value: messages.count, href: "/admin/messages" },
  ];

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="condensed text-[36px] sm:text-[44px]">Review queue</h1>
        <p className="text-[14px] text-muted">Signed in as {staff.email} ({staff.role})</p>
      </div>

      <dl className="mb-12 grid grid-cols-2 border-l border-t border-line sm:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="border-b border-r border-line p-4 hover:bg-wash">
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{s.label}</dt>
            <dd className="mt-1 text-[28px] font-bold">{(s.value ?? 0).toLocaleString()}</dd>
          </Link>
        ))}
      </dl>

      <section className="mb-12">
        <SectionTitle>New businesses ({employers.data?.length ?? 0})</SectionTitle>
        {!employers.data?.length ? <p className="py-6 text-body">Nothing waiting.</p> : (
          <ul>
            {employers.data.map((e) => {
              const owner = (e.members as unknown as { role: string; profile: Person }[]).find((m) => m.role === "owner")?.profile ?? null;
              return (
                <li key={e.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-line py-5">
                  <div className="min-w-0 flex-[1_1_360px]">
                    <p className="text-[18px] font-bold"><Link href={`/admin/employers/${e.id}`} className="hover:text-gold">{e.name}</Link></p>
                    <p className="text-[14px] text-body">{personName(owner)} · {owner?.email} · signed up {formatShortDate(e.created_at)}</p>
                    {e.website_url && <p className="text-[14px]"><a href={e.website_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{e.website_url}</a></p>}
                  </div>
                  <form action={reviewEmployer} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="employer_id" value={e.id} />
                    <button name="approve" value="1" className="bg-ink px-4 py-2.5 font-semibold text-white">Approve</button>
                    <label className="sr-only" htmlFor={`reason-${e.id}`}>Reason for denying</label>
                    <input id={`reason-${e.id}`} name="reason" placeholder="Reason (if denying)" className="h-11 w-[200px] border-[1.5px] border-ink px-3 text-[14px]" />
                    <button name="approve" value="0" className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Deny</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>Submitted events ({events.data?.length ?? 0})</SectionTitle>
        {!events.data?.length ? <p className="py-6 text-body">Nothing waiting.</p> : (
          <ul>
            {events.data.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-line py-5">
                <div className="min-w-0 flex-[1_1_360px]">
                  <p className="text-[18px] font-bold">
                    <Link href={`/admin/events/${ev.id}`} className="hover:text-gold">{ev.title}</Link>
                  </p>
                  <p className="text-[14px] text-body">{formatEventTime(ev.starts_at, ev.all_day)} · {ev.location_name} · from {ev.submitter_name} ({ev.submitter_email})</p>
                  <p className="mt-2 line-clamp-2 max-w-[640px] text-[15px]">{toPlainText(ev.description_html)}</p>
                  <Link href={`/admin/events/${ev.id}`} className="mt-1 inline-block text-[14px] font-semibold underline underline-offset-[3px]">View full details</Link>
                </div>
                <form action={reviewEvent} className="flex gap-2">
                  <input type="hidden" name="event_id" value={ev.id} />
                  <button name="approve" value="1" className="bg-ink px-4 py-2.5 font-semibold text-white">Approve</button>
                  <button name="approve" value="0" className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Reject</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

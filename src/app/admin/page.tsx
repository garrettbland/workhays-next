import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewClaim, reviewEmployer, reviewEvent } from "@/app/admin/actions";
import { formatEventTime, formatShortDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Queue />
      </Suspense>
    </PageShell>
  );
}

async function Queue() {
  const staff = await requireStaff("/admin");
  const supabase = await createClient();
  const [{ data: employers, error: e1 }, { data: claims, error: e2 }, { data: events, error: e3 }] = await Promise.all([
    supabase
      .from("employers")
      .select("id, name, email, website_url, created_at, members:employer_members(role, profile:profiles!employer_members_user_id_fkey(first_name, last_name, email))")
      .eq("site_id", SITE.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("employer_claims")
      .select("id, message, created_at, employer:employers(id, name), profile:profiles!employer_claims_user_id_fkey(first_name, last_name, email)")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("events")
      .select("id, title, starts_at, all_day, location_name, submitter_name, submitter_email, created_at")
      .eq("site_id", SITE.id)
      .eq("status", "pending")
      .order("created_at"),
  ]);

  const err = e1 ?? e2 ?? e3;
  if (err) throw new Error(`Admin queue failed to load: ${err.message}`);

  type Person = { first_name: string | null; last_name: string | null; email: string } | null;
  const personName = (p: Person) => (p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email : "Unknown");

  return (
    <>
      <PageTitle sub={`Signed in as ${staff.email} (${staff.role}).`}>Review queue</PageTitle>

      <section className="mb-12">
        <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">New businesses ({employers?.length ?? 0})</h2>
        {!employers?.length ? <p className="py-6 text-body">Nothing waiting.</p> : (
          <ul>
            {employers.map((e) => {
              const owner = (e.members as unknown as { role: string; profile: Person }[]).find((m) => m.role === "owner")?.profile ?? null;
              return (
                <li key={e.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-line py-5">
                  <div className="min-w-0 flex-[1_1_360px]">
                    <p className="text-[18px] font-bold">{e.name}</p>
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

      <section className="mb-12">
        <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Claim requests ({claims?.length ?? 0})</h2>
        {!claims?.length ? <p className="py-6 text-body">Nothing waiting.</p> : (
          <ul>
            {claims.map((c) => {
              const emp = c.employer as unknown as { id: string; name: string };
              const who = c.profile as unknown as Person;
              return (
                <li key={c.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-line py-5">
                  <div className="min-w-0 flex-[1_1_360px]">
                    <p className="text-[18px] font-bold"><Link href={`/employers/${emp.id}`}>{emp.name}</Link></p>
                    <p className="text-[14px] text-body">{personName(who)} · {who?.email}</p>
                    {c.message && <p className="mt-1 text-[15px]">“{c.message}”</p>}
                  </div>
                  <form action={reviewClaim} className="flex gap-2">
                    <input type="hidden" name="claim_id" value={c.id} />
                    <button name="approve" value="1" className="bg-ink px-4 py-2.5 font-semibold text-white">Approve</button>
                    <button name="approve" value="0" className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Reject</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Submitted events ({events?.length ?? 0})</h2>
        {!events?.length ? <p className="py-6 text-body">Nothing waiting.</p> : (
          <ul>
            {events.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-line py-5">
                <div className="min-w-0 flex-[1_1_360px]">
                  <p className="text-[18px] font-bold">{ev.title}</p>
                  <p className="text-[14px] text-body">{formatEventTime(ev.starts_at, ev.all_day)} · {ev.location_name} · from {ev.submitter_name} ({ev.submitter_email})</p>
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

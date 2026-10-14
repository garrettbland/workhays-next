import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { personName } from "@/lib/admin";
import { isUuid } from "@/lib/data";
import { formatEventTime, formatLongDate, formatShortDate } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { assetUrl } from "@/lib/site";
import { closeJobAsStaff, reviewEmployer, setEmployerStatus } from "@/app/admin/actions";
import { EmployerLogo } from "@/components/EmployerLogo";
import { Loading } from "@/components/ui/Page";
import { SectionTitle, StatusBadge, Table, td } from "@/components/admin/List";

export const metadata: Metadata = { title: "Employer · Admin", robots: { index: false } };

export default function AdminEmployerPage({ params }: PageProps<"/admin/employers/[id]">) {
  return (
    <>
      <Link href="/admin/employers" className="font-mono text-[13px] text-muted">← All employers</Link>
      <Suspense fallback={<Loading />}>
        <EmployerDetail params={params} />
      </Suspense>
    </>
  );
}

type P = { first_name: string | null; last_name: string | null; email: string } | null;

async function EmployerDetail({ params }: Pick<PageProps<"/admin/employers/[id]">, "params">) {
  const { id } = await params;
  await requireStaff(`/admin/employers/${id}`);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data: e, error }, { data: members }, { data: jobs }, { data: events }, { data: log }] = await Promise.all([
    supabase.from("employers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("employer_members")
      .select("role, created_at, profile:profiles!employer_members_user_id_fkey(id, first_name, last_name, email)")
      .eq("employer_id", id)
      .order("created_at"),
    supabase
      .from("jobs")
      .select("id, title, status, published_at, expires_at, auto_renew, deleted_at")
      .eq("employer_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("events").select("id, title, starts_at, all_day, status").eq("employer_id", id).is("deleted_at", null).order("starts_at", { ascending: false }).limit(50),
    supabase.from("audit_log").select("action, created_at, data").eq("entity_type", "employer").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (error) throw new Error(error.message);
  if (!e) notFound();

  const links = [
    ["Website", e.website_url],
    ["Facebook", e.facebook_url],
    ["Instagram", e.instagram_url],
    ["LinkedIn", e.linkedin_url],
    ["X", e.x_url],
    ["YouTube", e.youtube_url],
  ].filter(([, v]) => v) as [string, string][];
  const row = "grid gap-1 border-b border-line py-3 sm:grid-cols-[140px_1fr]";
  const label = "font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:pt-1";
  const jobsActive = (jobs ?? []).filter((j) => j.status === "active").length;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4">
        <EmployerLogo src={assetUrl(e.logo_path)} name={e.name} size={56} />
        <h1 className="condensed text-[34px] sm:text-[44px]">{e.name}</h1>
        <StatusBadge status={e.status} />
      </div>
      {e.status_reason && <p className="mt-2 text-[15px] text-body">Reason: {e.status_reason}</p>}

      <div className="mt-8 flex flex-wrap gap-12">
        <div className="min-w-0 flex-[999_1_560px]">
          <dl className="border-t-[3px] border-ink text-[16px]">
            <div className={row}><dt className={label}>Contact</dt><dd>{[e.contact_name, e.email, e.phone].filter(Boolean).join(" · ") || <span className="text-muted">None</span>}</dd></div>
            <div className={row}>
              <dt className={label}>Links</dt>
              <dd className="flex flex-wrap gap-x-4">
                {links.length ? links.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer nofollow" className="underline">{k}</a>) : <span className="text-muted">None</span>}
              </dd>
            </div>
            <div className={row}><dt className={label}>Joined</dt><dd>{formatLongDate(e.created_at)}{e.reviewed_at && ` · reviewed ${formatLongDate(e.reviewed_at)}`}</dd></div>
          </dl>
          {e.description_html && <div className="rich-text mt-6 border-l-[3px] border-line pl-5" dangerouslySetInnerHTML={{ __html: sanitizeRichText(e.description_html) }} />}

          <section className="mt-10">
            <SectionTitle>Team ({members?.length ?? 0})</SectionTitle>
            <Table head={["Name", "Email", "Role", "Added"]}>
              {(members ?? []).map((m) => {
                const pr = m.profile as unknown as P & { id: string };
                return (
                  <tr key={pr?.id}>
                    <td className={td}>{personName(pr)}</td>
                    <td className={td}><a href={`mailto:${pr?.email}`} className="underline">{pr?.email}</a></td>
                    <td className={`${td} capitalize`}>{m.role}</td>
                    <td className={`${td} text-body`}>{formatShortDate(m.created_at)}</td>
                  </tr>
                );
              })}
            </Table>
          </section>

          <section className="mt-10">
            <SectionTitle>Jobs ({jobsActive} active, {jobs?.length ?? 0} total)</SectionTitle>
            <Table head={["Job", "Status", "Posted", "Expires", ""]}>
              {(jobs ?? []).map((j) => (
                <tr key={j.id}>
                  <td className={td}>
                    {j.status === "active" ? <Link href={`/jobs/${j.id}`} className="font-semibold hover:text-gold">{j.title}</Link> : <span className="font-semibold">{j.title}</span>}
                    {j.auto_renew && <span className="ml-2 font-mono text-[11px] uppercase text-muted">auto-renew</span>}
                  </td>
                  <td className={td}><StatusBadge status={j.status} /></td>
                  <td className={`${td} text-body`}>{formatShortDate(j.published_at)}</td>
                  <td className={`${td} text-body`}>{formatShortDate(j.expires_at)}</td>
                  <td className={`${td} text-right`}>
                    {j.status === "active" && (
                      <form action={closeJobAsStaff}>
                        <input type="hidden" name="job_id" value={j.id} />
                        <button className="text-[14px] text-[#9b1c1c] underline underline-offset-[3px]">Take down</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </section>

          {!!events?.length && (
            <section className="mt-10">
              <SectionTitle>Events ({events.length})</SectionTitle>
              <Table head={["Date", "Event", "Status"]}>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td className={`${td} whitespace-nowrap font-mono text-[13px]`}>{formatEventTime(ev.starts_at, ev.all_day)}</td>
                    <td className={td}><Link href={`/admin/events/${ev.id}`} className="font-semibold hover:text-gold">{ev.title}</Link></td>
                    <td className={td}><StatusBadge status={ev.status} /></td>
                  </tr>
                ))}
              </Table>
            </section>
          )}
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-6">
          <section className="border-[1.5px] border-ink p-6">
            <h2 className="text-[18px] font-bold">{e.status === "pending" ? "Review this business" : "Status"}</h2>
            {e.status === "pending" ? (
              <form action={reviewEmployer} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="employer_id" value={e.id} />
                <input type="hidden" name="back" value="/admin" />
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                  Reason (emailed if you deny)
                  <input name="reason" className="h-11 border-[1.5px] border-ink px-3 text-[15px] font-normal" />
                </label>
                <div className="flex gap-2">
                  <button name="approve" value="1" className="bg-ink px-4 py-2.5 font-semibold text-white">Approve</button>
                  <button name="approve" value="0" className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Deny</button>
                </div>
              </form>
            ) : (
              <form action={setEmployerStatus} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="employer_id" value={e.id} />
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                  Reason (kept on file)
                  <input name="reason" defaultValue={e.status_reason ?? ""} className="h-11 border-[1.5px] border-ink px-3 text-[15px] font-normal" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {e.status !== "approved" && <button name="status" value="approved" className="bg-ink px-4 py-2.5 font-semibold text-white">Approve</button>}
                  {e.status !== "suspended" && <button name="status" value="suspended" className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Suspend</button>}
                </div>
                <p className="text-[13px] text-muted">Suspending hides the business and all its jobs right away. No email is sent.</p>
              </form>
            )}
          </section>
          {e.status === "approved" && <Link href={`/employers/${e.id}`} className="font-semibold underline underline-offset-[3px]">View public page ↗</Link>}
          {!!log?.length && (
            <section>
              <SectionTitle>History</SectionTitle>
              <ul className="text-[14px]">
                {log.map((l, i) => (
                  <li key={i} className="border-b border-line py-2">
                    <span className="text-body">{formatShortDate(l.created_at)}</span> · {l.action.replace("employer.", "").replace(/_/g, " ")}
                    {(l.data as { reason?: string } | null)?.reason && <span className="text-body"> ({(l.data as { reason: string }).reason})</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { personName } from "@/lib/admin";
import { isUuid } from "@/lib/data";
import { formatLongDate, formatPay, isPast, JOB_TYPE_LABELS } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { restoreJob, setJobExpiry, takeDownJob } from "@/app/admin/actions";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { StatusBadge } from "@/components/admin/List";

export const metadata: Metadata = { title: "Job · Admin", robots: { index: false } };

export default function AdminJobPage({ params, searchParams }: PageProps<"/admin/jobs/[id]">) {
  return (
    <>
      <Link href="/admin/jobs" className="font-mono text-[13px] text-muted">← All jobs</Link>
      <Suspense fallback={<Loading />}>
        <JobDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** "2026-11-05" in Central time, for a date input. */
const dateInput = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-CA", { timeZone: SITE.timezone }).format(new Date(iso)) : "";

async function postingDaysSetting(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("sites").select("settings").eq("id", SITE.id).single();
  return Number((data?.settings as { posting_days?: number } | null)?.posting_days ?? 30);
}

type P = { first_name: string | null; last_name: string | null; email: string } | null;

async function JobDetail({ params, searchParams }: Pick<PageProps<"/admin/jobs/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const saved = (await searchParams).saved === "1";
  await requireStaff(`/admin/jobs/${id}`);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data: j, error } = await supabase
    .from("jobs")
    .select(
      "*, employer:employers(id, name, status), creator:profiles!jobs_created_by_fkey(first_name, last_name, email), editor:profiles!jobs_updated_by_fkey(first_name, last_name, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!j) notFound();

  const employer = j.employer as { id: string; name: string; status: string };
  const status = j.deleted_at ? "deleted" : j.status === "archived" ? "taken down" : (j.status as string);
  const pay = formatPay(j.pay_min, j.pay_max, j.pay_period);
  const live = j.status === "active" && !j.deleted_at;
  const expired = !j.expires_at || isPast(j.expires_at);
  const postingDays = await postingDaysSetting();
  const row = "grid gap-1 border-b border-line py-3 sm:grid-cols-[160px_1fr]";
  const label = "font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:pt-1";
  const rows: [string, ReactNode][] = [
    ["Business", <><Link key="e" href={`/admin/employers/${employer.id}`} className="underline">{employer.name}</Link>{employer.status !== "approved" && <span className="ml-2"><StatusBadge status={employer.status} /></span>}</>],
    ["Type", JOB_TYPE_LABELS[j.job_type] ?? j.job_type],
    ["Location", j.location || <span className="text-muted">Not given</span>],
    ["Pay", pay ?? <span className="text-muted">Not given</span>],
    ["Apply", j.application_url ? <a href={j.application_url} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{j.application_url}</a> : j.application_email || <span className="text-muted">Contact the business</span>],
    ["Published", j.published_at ? formatLongDate(j.published_at) : <span className="text-muted">Never (draft)</span>],
    ["Last renewed", formatLongDate(j.bumped_at) || "—"],
    ["Expires", formatLongDate(j.expires_at) || "—"],
    ["Auto-renew", j.auto_renew ? `On${j.auto_renew_confirmed_at ? `, last confirmed ${formatLongDate(j.auto_renew_confirmed_at)}` : ""}` : "Off"],
    ["Closed", j.closed_at ? formatLongDate(j.closed_at) : "—"],
    ["Created", `${formatLongDate(j.created_at)}${j.creator ? ` by ${personName(j.creator as P)}` : ""}`],
    ["Last edited", `${formatLongDate(j.updated_at)}${j.editor ? ` by ${personName(j.editor as P)}` : ""}`],
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-12">
      <article className="min-w-0 flex-[999_1_560px]">
        <StatusBadge status={status} />
        <h1 className="condensed mt-3 text-[34px] sm:text-[44px]">{j.title}</h1>
        <dl className="mt-6 border-t-[3px] border-ink text-[16px]">
          {rows.map(([k, v]) => (
            <div key={k} className={row}><dt className={label}>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <h2 className="mt-8 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Description</h2>
        <div className="rich-text mt-2 border-l-[3px] border-line pl-5" dangerouslySetInnerHTML={{ __html: sanitizeRichText(j.description_html) }} />
      </article>
      <aside className="flex flex-[1_1_300px] flex-col gap-6">
        {saved && <p role="status" className="border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">Changes saved.</p>}
        <Link href={`/admin/jobs/${j.id}/edit`} className="bg-ink px-5 py-3 text-center font-semibold text-white hover:bg-black hover:text-white">Edit job</Link>
        {live && <Link href={`/jobs/${j.id}`} className="font-semibold underline underline-offset-[3px]">View public page ↗</Link>}

        {!j.deleted_at && (
          <form id="status" action={live ? takeDownJob : restoreJob} className="flex flex-col gap-3 border-[1.5px] border-ink p-6">
            <input type="hidden" name="job_id" value={j.id} />
            <h2 className="text-[18px] font-bold">{live ? "Take this job down" : "Put this job back up"}</h2>
            <p className="text-[14px] text-body">
              {live
                ? "It comes off the site right away. The business still sees it in their dashboard."
                : `It goes live again${expired ? ` for a fresh ${postingDays} days` : ` until ${formatLongDate(j.expires_at)}`}.`}
            </p>
            <label className="flex items-center gap-3 text-[15px]">
              <input type="checkbox" name="notify" defaultChecked={live} className="size-5 accent-[#8a5a00]" /> Email the business
            </label>
            <label className="flex flex-col gap-1 text-[13px] font-semibold">
              Message <span className="font-normal text-muted">(optional, included in the email)</span>
              <textarea name="message" rows={3} maxLength={1000} className="border-[1.5px] border-ink px-3 py-2 text-[15px] font-normal" />
            </label>
            <div>
              {live ? (
                <button className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c] hover:bg-[#fdf2f2]">Take down</button>
              ) : employer.status !== "approved" ? (
                <p className="text-[14px] text-[#7a1616]">The business is {employer.status}. Approve it first, then put the job back up.</p>
              ) : (
                <button className="bg-ink px-4 py-2.5 font-semibold text-white">Put back up</button>
              )}
            </div>
          </form>
        )}

        {live && (
          <form action={setJobExpiry} className="flex flex-col gap-3 border-[1.5px] border-ink p-6">
            <input type="hidden" name="job_id" value={j.id} />
            <h2 className="text-[18px] font-bold">Expiry date</h2>
            <label className="flex flex-col gap-1 text-[13px] font-semibold">
              Expires at the end of
              <input type="date" name="expires_on" required defaultValue={dateInput(j.expires_at)} className="h-11 border-[1.5px] border-ink px-3 text-[15px] font-normal" />
            </label>
            <div><button className="border-[1.5px] border-ink px-4 py-2 font-semibold hover:text-gold">Save date</button></div>
            <p className="text-[13px] text-muted">Doesn&apos;t move it up the list. The business gets the usual reminder before it expires.</p>
          </form>
        )}
      </aside>
    </div>
  );
}

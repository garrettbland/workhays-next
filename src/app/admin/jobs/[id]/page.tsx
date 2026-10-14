import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { personName } from "@/lib/admin";
import { isUuid } from "@/lib/data";
import { formatLongDate, formatPay, JOB_TYPE_LABELS } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { closeJobAsStaff } from "@/app/admin/actions";
import { Loading } from "@/components/ui/Page";
import { StatusBadge } from "@/components/admin/List";

export const metadata: Metadata = { title: "Job · Admin", robots: { index: false } };

export default function AdminJobPage({ params }: PageProps<"/admin/jobs/[id]">) {
  return (
    <>
      <Link href="/admin/jobs" className="font-mono text-[13px] text-muted">← All jobs</Link>
      <Suspense fallback={<Loading />}>
        <JobDetail params={params} />
      </Suspense>
    </>
  );
}

type P = { first_name: string | null; last_name: string | null; email: string } | null;

async function JobDetail({ params }: Pick<PageProps<"/admin/jobs/[id]">, "params">) {
  const { id } = await params;
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
      <aside className="flex flex-[1_1_280px] flex-col gap-5">
        {j.status === "active" && !j.deleted_at && (
          <>
            <Link href={`/jobs/${j.id}`} className="font-semibold underline underline-offset-[3px]">View public page ↗</Link>
            <form action={closeJobAsStaff} className="border-[1.5px] border-ink p-6">
              <input type="hidden" name="job_id" value={j.id} />
              <p className="text-[15px]">Take this job off the site. The business can still see it in their dashboard.</p>
              <button className="mt-4 border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Take down</button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}

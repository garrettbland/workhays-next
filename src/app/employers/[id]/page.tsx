import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getEmployer, getLiveJobs } from "@/lib/data";
import { formatShortDate, JOB_TYPE_LABELS } from "@/lib/format";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";
import { assetUrl, SITE } from "@/lib/site";
import { EmployerLogo } from "@/components/EmployerLogo";

export async function generateStaticParams() {
  const jobs = await getLiveJobs(SITE.id);
  const ids = [...new Set(jobs.map((j) => j.employer_id))];
  return ids.length ? ids.map((id) => ({ id })) : [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata({ params }: PageProps<"/employers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const employer = await getEmployer(id);
  if (!employer) notFound(); // real 404 for search engines (they get metadata before the page streams)
  return {
    title: `${employer.name}: jobs`,
    description: toPlainText(employer.description_html).slice(0, 160) || `Open jobs at ${employer.name} on Work Hays.`,
    alternates: { canonical: `/employers/${employer.id}` },
  };
}

export default function EmployerPage({ params }: PageProps<"/employers/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <Link href="/employers" className="font-mono text-[13px] text-muted">← All employers</Link>
      <Suspense fallback={<div className="mt-6 h-12 w-1/2 animate-pulse bg-wash" />}>
        <EmployerContent params={params} />
      </Suspense>
    </main>
  );
}

const LINKS = [
  ["website_url", "Website"],
  ["facebook_url", "Facebook"],
  ["instagram_url", "Instagram"],
  ["linkedin_url", "LinkedIn"],
  ["x_url", "X"],
  ["youtube_url", "YouTube"],
] as const;

async function EmployerContent({ params }: Pick<PageProps<"/employers/[id]">, "params">) {
  const { id } = await params;
  // Rendered per request from cached data, so takedowns and edits show on the very next view.
  await connection();
  const [employer, liveJobs] = await Promise.all([getEmployer(id), getLiveJobs(SITE.id)]);
  if (!employer) notFound();
  const jobs = liveJobs.filter((j) => j.employer_id === employer.id);
  const links = LINKS.filter(([key]) => employer[key]).map(([key, label]) => ({ href: employer[key]!, label }));
  const description = sanitizeRichText(employer.description_html);

  return (
    <div className="mt-6 flex flex-wrap gap-12">
      <div className="min-w-0 flex-[999_1_560px]">
        <div className="flex flex-wrap items-center gap-5">
          <EmployerLogo src={assetUrl(employer.logo_path)} name={employer.name} />
          <h1 className="condensed text-[36px] sm:text-[48px]">{employer.name}</h1>
        </div>
        {links.length > 0 && (
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-[3px]">
                {l.label} ↗
              </a>
            ))}
          </p>
        )}

        <h2 className="mt-10 border-b-[3px] border-ink pb-3 font-mono text-[13px] uppercase tracking-[0.08em]">
          {jobs.length ? `Open jobs (${jobs.length})` : "Open jobs"}
        </h2>
        {jobs.length === 0 ? (
          <p className="py-6 text-body">No open jobs right now. <Link href="/" className="underline underline-offset-[3px]">See all jobs</Link>.</p>
        ) : (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="border-b border-line">
                <Link href={`/jobs/${job.id}`} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
                  <span className="min-w-0 flex-[1_1_320px] text-[18px] font-bold">{job.title}</span>
                  <span className="text-[14px] text-muted">{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</span>
                  <span className="w-[80px] text-right font-mono text-[12px] uppercase text-muted">{formatShortDate(job.bumped_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {description && (
          <>
            <h2 className="mt-12 border-b-[3px] border-ink pb-3 font-mono text-[13px] uppercase tracking-[0.08em]">About</h2>
            <div className="rich-text mt-6" dangerouslySetInnerHTML={{ __html: description }} />
          </>
        )}
      </div>

      <aside className="flex flex-[1_1_280px] flex-col gap-4">
        {(employer.contact_name || employer.phone || employer.email) && (
          <section className="border-[1.5px] border-ink p-6 text-[15px]">
            <h2 className="mb-2 text-[17px] font-bold">Contact</h2>
            {employer.contact_name && <p>{employer.contact_name}</p>}
            {employer.phone && <p><a href={`tel:${employer.phone.replace(/[^\d+]/g, "")}`}>{employer.phone}</a></p>}
            {employer.email && <p className="truncate"><a href={`mailto:${employer.email}`}>{employer.email}</a></p>}
          </section>
        )}
      </aside>
    </div>
  );
}

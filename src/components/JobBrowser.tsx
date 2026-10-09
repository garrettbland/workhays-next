import Link from "next/link";
import { getIndustries, getLiveJobs, type JobListing } from "@/lib/data";
import { formatShortDate, JOB_TYPE_LABELS } from "@/lib/format";
import { SITE } from "@/lib/site";

const PAGE_SIZE = 30;

export type JobFilters = { q: string; type: string; industry: string; page: number };
export const NO_FILTERS: JobFilters = { q: "", type: "", industry: "", page: 1 };

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): JobFilters {
  const page = Number.parseInt(first(sp.page), 10);
  return {
    q: first(sp.q).slice(0, 100),
    type: first(sp.type),
    industry: first(sp.industry),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function hrefFor(f: JobFilters, patch: Partial<JobFilters>): string {
  const next = { ...f, page: 1, ...patch };
  const p = new URLSearchParams();
  if (next.q) p.set("q", next.q);
  if (next.type) p.set("type", next.type);
  if (next.industry) p.set("industry", next.industry);
  if (next.page > 1) p.set("page", String(next.page));
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

function applyFilters(jobs: JobListing[], f: JobFilters): JobListing[] {
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return jobs.filter((j) => {
    if (f.type && j.job_type !== f.type) return false;
    if (f.industry && j.industry !== f.industry) return false;
    if (terms.length) {
      const hay = `${j.title} ${j.employer_name} ${j.location ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    }
    return true;
  });
}

/** Renders the search form, industry filters and results for the given filters. */
export async function JobBrowser({ filters }: { filters: JobFilters }) {
  const [jobs, industries] = await Promise.all([getLiveJobs(SITE.id), getIndustries(SITE.id)]);

  const counts = new Map<string, number>();
  for (const j of jobs) if (j.industry) counts.set(j.industry, (counts.get(j.industry) ?? 0) + 1);
  const industryLinks = industries
    .filter((i) => counts.has(i.slug))
    .sort((a, b) => counts.get(b.slug)! - counts.get(a.slug)!);

  const matches = applyFilters(jobs, filters);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = Boolean(filters.q || filters.type || filters.industry);
  const activeIndustry = industries.find((i) => i.slug === filters.industry);

  return (
    <>
      <form action="/" method="get" role="search" className="mt-7 flex max-w-[760px] flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search jobs</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search jobs or employers"
          className="h-12 min-w-0 flex-[1_1_280px] border-[1.5px] border-ink px-3.5 text-[16px]"
        />
        <label htmlFor="type" className="sr-only">Job type</label>
        <select id="type" name="type" defaultValue={filters.type} className="h-12 border-[1.5px] border-ink bg-paper px-3 text-[15px]">
          <option value="">All types</option>
          {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {filters.industry && <input type="hidden" name="industry" value={filters.industry} />}
        <button type="submit" className="h-12 bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black">
          Search
        </button>
      </form>

      <div className="mt-7 border-t-[3px] border-ink" />

      <nav aria-label="Industries" className="flex gap-x-[22px] gap-y-2 border-b border-line py-[18px] text-[14px] max-sm:-mx-6 max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:px-6 sm:flex-wrap">
        <Link
          href={hrefFor(filters, { industry: "" })}
          className={filters.industry ? "" : "font-bold text-gold"}
          aria-current={filters.industry ? undefined : "page"}
        >
          All industries
        </Link>
        {industryLinks.map((i) => {
          const active = i.slug === filters.industry;
          return (
            <Link
              key={i.slug}
              href={hrefFor(filters, { industry: i.slug })}
              className={active ? "font-bold text-gold" : ""}
              aria-current={active ? "page" : undefined}
            >
              {i.name} <span className="font-mono text-[12px] text-muted">{counts.get(i.slug)}</span>
            </Link>
          );
        })}
      </nav>

      {filtered && (
        <p className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 text-[14px] text-muted" aria-live="polite">
          <span>
            {matches.length} {matches.length === 1 ? "job" : "jobs"}
            {filters.q && <> matching “{filters.q}”</>}
            {activeIndustry && <> in {activeIndustry.name}</>}
            {filters.type && <> · {JOB_TYPE_LABELS[filters.type] ?? filters.type}</>}
          </span>
          <Link href="/" className="underline underline-offset-[3px]">Clear filters</Link>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[18px] font-bold">No jobs match those filters.</p>
          <p className="mt-2 text-muted">Try a different search, or <Link href="/" className="underline underline-offset-[3px]">see all jobs</Link>.</p>
        </div>
      ) : (
        <ul>
          {shown.map((job) => (
            <li key={job.id} className={`border-b border-line ${job.is_featured ? "bg-gold-tint" : ""}`}>
              <Link href={`/jobs/${job.id}`} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-3 py-[18px]">
                <span className="min-w-0 flex-[1_1_380px] text-[18px] font-bold">{job.title}</span>
                <span className="min-w-0 flex-[0_1_260px] text-[15px] text-body">{job.employer_name}</span>
                <span className="flex-[0_0_90px] text-[14px] text-muted">{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</span>
                <span
                  className={`flex-[0_0_110px] text-right font-mono text-[12px] uppercase tracking-[0.04em] max-sm:text-left ${
                    job.is_featured ? "font-medium text-gold" : "text-muted"
                  }`}
                >
                  {job.is_featured ? "Featured" : formatShortDate(job.bumped_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-3 pt-8">
          {page > 1 && (
            <Link href={hrefFor(filters, { page: page - 1 })} className="border-[1.5px] border-ink px-6 py-3.5 font-semibold">
              Newer jobs
            </Link>
          )}
          <span className="font-mono text-[12px] text-muted">Page {page} of {pages}</span>
          {page < pages && (
            <Link href={hrefFor(filters, { page: page + 1 })} className="border-[1.5px] border-ink px-6 py-3.5 font-semibold">
              More jobs
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

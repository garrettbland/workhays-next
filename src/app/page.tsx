import { getLiveJobs, getIndustries, JOB_TYPE_LABELS } from "@/lib/jobs";
import { publicEnv } from "@/lib/env";

export default async function HomePage() {
  const siteId = publicEnv.NEXT_PUBLIC_SITE_ID;
  const [jobs, industries] = await Promise.all([getLiveJobs(siteId), getIndustries(siteId)]);
  const industryName = new Map(industries.map((i) => [i.slug, i.name]));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Work Hays</h1>
        <p className="mt-1 text-muted">
          {jobs.length} open {jobs.length === 1 ? "position" : "positions"} in Hays and western Kansas
        </p>
      </header>

      <ul className="divide-y divide-line border-y border-line">
        {jobs.map((job) => (
          <li key={job.id} className="py-4">
            <a href={`/jobs/${job.id}`} className="group block">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium group-hover:text-accent">{job.title}</h2>
                {job.is_featured && <span className="text-xs font-medium text-accent">Featured</span>}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {job.employer_name}
                {" · "}
                {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                {job.industry && ` · ${industryName.get(job.industry) ?? job.industry}`}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

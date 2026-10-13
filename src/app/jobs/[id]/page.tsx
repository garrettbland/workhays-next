import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndustries, getJob, getLiveJobs, type JobDetail } from "@/lib/data";
import { formatLongDate, formatPay, JOB_TYPE_LABELS, JOB_TYPE_SCHEMA } from "@/lib/format";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";
import { assetUrl, SITE } from "@/lib/site";
import { EmployerLogo } from "@/components/EmployerLogo";

export async function generateStaticParams() {
  const jobs = await getLiveJobs(SITE.id);
  // Must return at least one param; unlisted jobs still render on first request.
  return jobs.length ? jobs.map((j) => ({ id: j.id })) : [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job no longer available", robots: { index: false } };
  const description = toPlainText(job.description_html).slice(0, 160);
  return {
    title: `${job.title} at ${job.employer.name}`,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: { title: `${job.title} · ${job.employer.name}`, description, url: `/jobs/${job.id}` },
  };
}

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <Link href="/" className="font-mono text-[13px] text-muted">← All jobs</Link>
      <Suspense fallback={<JobSkeleton />}>
        <JobContent params={params} />
      </Suspense>
    </main>
  );
}

async function JobContent({ params }: Pick<PageProps<"/jobs/[id]">, "params">) {
  const { id } = await params;
  const [job, liveJobs, industries] = await Promise.all([getJob(id), getLiveJobs(SITE.id), getIndustries(SITE.id)]);
  if (!job) notFound();

  const industry = industries.find((i) => i.slug === job.industry)?.name;
  const pay = formatPay(job.pay_min, job.pay_max, job.pay_period);
  const employerJobCount = liveJobs.filter((j) => j.employer_id === job.employer.id).length;
  const meta = [JOB_TYPE_LABELS[job.job_type] ?? job.job_type, industry, `Posted ${formatLongDate(job.bumped_at)}`]
    .filter(Boolean)
    .join(" · ");
  const apply = applyTarget(job);

  return (
    <div className="mt-6 flex flex-wrap gap-12">
      <article className="min-w-0 flex-[999_1_560px]">
        <p className="mb-2.5 font-mono text-[13px] uppercase tracking-[0.08em] text-muted">{meta}</p>
        <h1 className="condensed text-[36px] sm:text-[48px]">{job.title}</h1>
        <p className="mt-3 text-[20px]">
          <Link href={`/employers/${job.employer.id}`} className="underline underline-offset-4">{job.employer.name}</Link>
          {job.location && <> · {job.location}</>}
        </p>
        {pay && <p className="mt-2 text-[17px] font-semibold">{pay}</p>}

        <div className="my-8 flex flex-wrap gap-3 border-b-[3px] border-ink pb-8">
          {apply ? (
            <a
              href={apply.href}
              target={apply.external ? "_blank" : undefined}
              rel={apply.external ? "noopener noreferrer nofollow" : undefined}
              className="bg-ink px-7 py-[15px] text-[16px] font-semibold text-white hover:bg-black hover:text-white"
            >
              {apply.label}
            </a>
          ) : (
            <p className="text-[16px] text-body">To apply, contact {job.employer.name} directly{job.employer.phone ? ` at ${job.employer.phone}` : ""}.</p>
          )}
        </div>

        <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description_html) }} />
      </article>

      <aside className="flex flex-[1_1_280px] flex-col gap-6">
        <section className="border-[1.5px] border-ink p-6">
          <div className="mb-3"><EmployerLogo src={assetUrl(job.employer.logo_path)} name={job.employer.name} size={64} /></div>
          <h2 className="text-[20px] font-bold">{job.employer.name}</h2>
          {job.employer.website_url && (
            <p className="mt-1 truncate text-[15px] text-body">
              <a href={job.employer.website_url} target="_blank" rel="noopener noreferrer nofollow">
                {job.employer.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            </p>
          )}
          <Link href={`/employers/${job.employer.id}`} className="mt-4 inline-block font-semibold underline underline-offset-4">
            {employerJobCount > 1 ? `${employerJobCount} open jobs at ${job.employer.name}` : `About ${job.employer.name}`}
          </Link>
        </section>
        <p className="text-[14px] text-muted">Listing expires {formatLongDate(job.expires_at)}.</p>
        <Link href={`/contact?report=${job.id}`} className="text-[14px] text-muted underline underline-offset-[3px]">Report this listing</Link>
      </aside>

      <script
        type="application/ld+json"
        // Google for Jobs structured data
        dangerouslySetInnerHTML={{ __html: jsonLd(job) }}
      />
    </div>
  );
}

function applyTarget(job: JobDetail): { href: string; label: string; external: boolean } | null {
  if (job.application_url) {
    let host = "";
    try {
      host = new URL(job.application_url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
    return { href: job.application_url, label: `Apply on ${host} ↗`, external: true };
  }
  if (job.application_email) {
    const subject = encodeURIComponent(`Application: ${job.title}`);
    return { href: `mailto:${job.application_email}?subject=${subject}`, label: "Apply by email", external: false };
  }
  return null;
}

function jsonLd(job: JobDetail): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: sanitizeRichText(job.description_html),
    datePosted: job.published_at,
    validThrough: job.expires_at,
    employmentType: JOB_TYPE_SCHEMA[job.job_type] ?? "OTHER",
    identifier: { "@type": "PropertyValue", name: job.employer.name, value: job.id },
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer.name,
      ...(job.employer.website_url ? { sameAs: job.employer.website_url } : {}),
      ...(job.employer.logo_path ? { logo: assetUrl(job.employer.logo_path) } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location?.split(",")[0]?.trim() || SITE.defaultLocation.locality,
        addressRegion: SITE.defaultLocation.region,
        addressCountry: SITE.defaultLocation.country,
      },
    },
    ...(job.pay_min != null || job.pay_max != null
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: {
              "@type": "QuantitativeValue",
              ...(job.pay_min != null ? { minValue: job.pay_min } : {}),
              ...(job.pay_max != null ? { maxValue: job.pay_max } : {}),
              unitText: (job.pay_period ?? "hour").toUpperCase(),
            },
          },
        }
      : {}),
    url: `${SITE.url}/jobs/${job.id}`,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function JobSkeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-hidden="true">
      <div className="h-4 w-64 bg-wash" />
      <div className="mt-4 h-12 w-3/4 bg-wash" />
      <div className="mt-4 h-6 w-1/3 bg-wash" />
      <div className="mt-10 h-40 w-full max-w-[680px] bg-wash" />
    </div>
  );
}

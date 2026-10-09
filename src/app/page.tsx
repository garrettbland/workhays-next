import { Suspense } from "react";
import Link from "next/link";
import { JobBrowser, NO_FILTERS, parseFilters } from "@/components/JobBrowser";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-12">
      <h1 className="condensed text-[40px] sm:text-[52px]">
        Local jobs.
        <br />
        Hays &amp; western Kansas.
      </h1>

      {/* The unfiltered list is prerendered as the fallback, so the page is instant;
          filters from the URL stream in over it. */}
      <Suspense fallback={<JobBrowser filters={NO_FILTERS} />}>
        <FilteredJobs searchParams={searchParams} />
      </Suspense>

      <section className="mt-[72px] flex flex-wrap items-center justify-between gap-6 border-b border-t-[3px] border-line border-t-ink py-7">
        <div className="flex-[1_1_420px]">
          <h2 className="condensed text-[26px]">Hiring in western Kansas?</h2>
          <p className="mt-1.5 text-[16px] text-body">Post jobs free. Invite your team to help manage listings.</p>
        </div>
        <Link href="/sign-up" className="bg-ink px-6 py-3.5 font-semibold text-white hover:bg-black hover:text-white">
          Create an employer account
        </Link>
      </section>
    </main>
  );
}

async function FilteredJobs({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  return <JobBrowser filters={parseFilters(await searchParams)} />;
}

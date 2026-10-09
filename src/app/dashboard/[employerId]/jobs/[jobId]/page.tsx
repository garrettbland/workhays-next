import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyEmployer } from "@/lib/dashboard";
import { getIndustries } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { deleteJob } from "@/app/dashboard/actions";
import { formatLongDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { JobForm, type JobFormValues } from "@/components/dashboard/JobForm";
import { Badge, Loading } from "@/components/ui/Page";

export default function EditJobPage({ params }: PageProps<"/dashboard/[employerId]/jobs/[jobId]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/dashboard/[employerId]/jobs/[jobId]">, "params">) {
  const { employerId, jobId } = await params;
  const [{ employer }, industries] = await Promise.all([
    getMyEmployer(employerId, `/dashboard/${employerId}/jobs/${jobId}`),
    getIndustries(SITE.id),
  ]);
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, title, job_type, industry, location, pay_min, pay_max, pay_period, application_url, application_email, description_html, auto_renew, expires_at, created_by")
    .eq("id", jobId)
    .eq("employer_id", employer.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!job) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-bold">Edit job</h2>
        <Badge tone={job.status === "active" ? "good" : job.status === "draft" ? "neutral" : "gold"}>{job.status === "active" ? "Live" : job.status}</Badge>
        {job.status === "active" && (
          <>
            <span className="text-[14px] text-muted">Expires {formatLongDate(job.expires_at)}</span>
            <Link href={`/jobs/${job.id}`} className="text-[14px] underline underline-offset-[3px]">View public page ↗</Link>
          </>
        )}
      </div>
      <JobForm employerId={employer.id} industries={industries} canPublish={employer.status === "approved"} values={job as JobFormValues} />
      <form action={deleteJob} className="mt-12 max-w-[760px] border-t border-line pt-6">
        <input type="hidden" name="job_id" value={job.id} />
        <input type="hidden" name="employer_id" value={employer.id} />
        <button type="submit" className="text-[14px] text-[#9b1c1c] underline underline-offset-[3px]">Delete this job</button>
      </form>
    </>
  );
}

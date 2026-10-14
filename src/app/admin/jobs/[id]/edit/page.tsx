import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getIndustries, isUuid } from "@/lib/data";
import { SITE } from "@/lib/site";
import { JobForm, type JobFormValues } from "@/components/dashboard/JobForm";
import { Loading } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Edit job · Admin", robots: { index: false } };

export default function AdminEditJobPage({ params }: PageProps<"/admin/jobs/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/admin/jobs/[id]/edit">, "params">) {
  const { id } = await params;
  await requireStaff(`/admin/jobs/${id}/edit`);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data: job }, industries] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status, title, job_type, industry, location, pay_min, pay_max, pay_period, application_url, application_email, description_html, auto_renew, employer_id, employer:employers(name)")
      .eq("id", id)
      .maybeSingle(),
    getIndustries(SITE.id),
  ]);
  if (!job) notFound();
  const employer = job.employer as unknown as { name: string } | null;
  return (
    <>
      <Link href={`/admin/jobs/${job.id}`} className="font-mono text-[13px] text-muted">← Back to the job</Link>
      <h1 className="condensed mb-2 mt-4 text-[34px] sm:text-[44px]">Edit job</h1>
      <p className="mb-8 text-[16px] text-body">For {employer?.name}. Saving doesn&apos;t email the business or change whether it&apos;s live.</p>
      <JobForm admin employerId={job.employer_id} industries={industries} canPublish values={job as unknown as JobFormValues} />
    </>
  );
}

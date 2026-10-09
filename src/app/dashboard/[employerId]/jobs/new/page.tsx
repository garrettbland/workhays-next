import { Suspense } from "react";
import { getMyEmployer } from "@/lib/dashboard";
import { getIndustries } from "@/lib/data";
import { SITE } from "@/lib/site";
import { JobForm } from "@/components/dashboard/JobForm";
import { Loading } from "@/components/ui/Page";

export default function NewJobPage({ params }: PageProps<"/dashboard/[employerId]/jobs/new">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/dashboard/[employerId]/jobs/new">, "params">) {
  const { employerId } = await params;
  const [{ employer }, industries] = await Promise.all([
    getMyEmployer(employerId, `/dashboard/${employerId}/jobs/new`),
    getIndustries(SITE.id),
  ]);
  return (
    <>
      <h2 className="mb-6 text-[22px] font-bold">Post a job</h2>
      <JobForm
        employerId={employer.id}
        industries={industries}
        canPublish={employer.status === "approved"}
        values={{
          title: "", job_type: "full_time", industry: null, location: null, pay_min: null, pay_max: null, pay_period: "hour",
          application_url: employer.website_url, application_email: null, description_html: "", auto_renew: false,
        }}
      />
    </>
  );
}

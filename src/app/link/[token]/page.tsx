import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { formatLongDate } from "@/lib/format";
import { LinkAction } from "@/components/LinkAction";
import { Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Confirm", robots: { index: false, follow: false } };

export default function LinkPage({ params }: PageProps<"/link/[token]">) {
  return (
    <PageShell narrow>
      <Suspense fallback={<Loading />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}

type Info = {
  purpose: "job_renew" | "job_close" | "job_confirm_auto_renew" | "subscriber_confirm" | "subscriber_unsubscribe";
  state: "valid" | "used" | "expired";
  job: { title: string; employer_name: string; status: string; expires_at: string; auto_renew: boolean } | null;
  email: string | null;
};

async function Content({ params }: Pick<PageProps<"/link/[token]">, "params">) {
  const { token } = await params;
  const { data } = await createPublicClient().rpc("get_action_token", { p_token: token });
  const info = data as Info | null;

  if (!info) return <PageTitle sub="This link isn't valid. It may have been copied incompletely.">Link not found</PageTitle>;
  if (info.state === "used") {
    // Shown right after the button is pressed too (the page re-renders), so say exactly what happened.
    const j = info.job;
    const done = {
      job_renew: j ? `${j.title} is renewed and live until ${formatLongDate(j.expires_at)}.` : "The job has been renewed.",
      job_close: j ? `${j.title} is marked filled and no longer listed.` : "The job has been marked filled.",
      job_confirm_auto_renew: j ? `${j.title} will keep renewing automatically.` : "Auto-renew confirmed.",
      subscriber_confirm: "You're subscribed. Look for new jobs in your inbox every Monday.",
      subscriber_unsubscribe: "You've been unsubscribed.",
    }[info.purpose];
    const isJob = info.purpose.startsWith("job_");
    return (
      <>
        <PageTitle sub={done}>All set</PageTitle>
        <Link href={isJob ? "/dashboard" : "/"} className="font-semibold underline underline-offset-[3px]">
          {isJob ? "Go to your dashboard" : "Browse jobs"}
        </Link>
      </>
    );
  }
  if (info.state === "expired") {
    return (
      <>
        <PageTitle sub="Links in our emails expire after a week. Sign in to manage your jobs instead.">This link has expired</PageTitle>
        <Link href="/sign-in" className="font-semibold underline underline-offset-[3px]">Sign in</Link>
      </>
    );
  }

  const job = info.job;
  const view = {
    job_renew: {
      title: `Renew ${job?.title ?? "this job"}?`,
      sub: `${job?.employer_name} · renewing keeps it up for 30 more days and moves it back to the top.`,
      button: "Renew for 30 days",
    },
    job_close: {
      title: `Mark ${job?.title ?? "this job"} as filled?`,
      sub: `${job?.employer_name} · the listing will come down from Work Hays. You can repost it from your dashboard.`,
      button: "Yes, it's filled",
    },
    job_confirm_auto_renew: {
      title: `Still hiring for ${job?.title ?? "this job"}?`,
      sub: `${job?.employer_name} · confirm and we'll keep renewing it automatically.`,
      button: "Yes, keep it up",
    },
    subscriber_confirm: {
      title: "Confirm your subscription",
      sub: `Get new jobs in Hays and western Kansas every Monday at ${info.email}.`,
      button: "Confirm subscription",
    },
    subscriber_unsubscribe: {
      title: "Unsubscribe from job emails?",
      sub: `${info.email} won't get the weekly jobs email anymore.`,
      button: "Unsubscribe",
    },
  }[info.purpose];

  return (
    <>
      <PageTitle sub={view.sub}>{view.title}</PageTitle>
      {job && job.status === "active" && info.purpose !== "job_close" && (
        <p className="mb-6 font-mono text-[13px] uppercase text-muted">Currently expires {formatLongDate(job.expires_at)}</p>
      )}
      <LinkAction token={token} label={view.button} />
    </>
  );
}

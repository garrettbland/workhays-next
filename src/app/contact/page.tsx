import { Suspense } from "react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/PublicForms";
import { getEvent, getJob } from "@/lib/data";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with Work Hays.", alternates: { canonical: "/contact" } };

export default function ContactPage({ searchParams }: PageProps<"/contact">) {
  return (
    <PageShell>
      <PageTitle sub="Questions about posting jobs, a problem with your account, or a listing that doesn't look right? Send us a note.">Contact us</PageTitle>
      <Suspense fallback={<div className="h-96 max-w-[640px] animate-pulse bg-wash" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/contact">, "searchParams">) {
  const sp = await searchParams;
  const jobId = typeof sp.report === "string" ? sp.report : "";
  const job = jobId ? await getJob(jobId) : null;
  const eventId = typeof sp.event === "string" ? sp.event : "";
  const ev = !job && eventId ? await getEvent(eventId) : null;
  const initial = job
    ? `I'd like to report this listing: "${job.title}" at ${job.employer.name} (/jobs/${job.id}).\n\nReason: `
    : ev
      ? `I'd like to report this event: "${ev.title}" (/events/${ev.id}).\n\nReason: `
      : "";
  return <ContactForm initialMessage={initial} />;
}

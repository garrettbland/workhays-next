import type { Metadata } from "next";
import Link from "next/link";
import { EventSubmitForm } from "@/components/PublicForms";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = {
  title: "Submit an event",
  description: "Share a hiring or community event in Hays and western Kansas.",
  alternates: { canonical: "/events/submit" },
};

export default function SubmitEventPage() {
  return (
    <PageShell>
      <div className="mb-4 font-mono text-[13px] text-muted"><Link href="/events">← Events</Link></div>
      <PageTitle sub="Hiring events and community happenings. A moderator reviews every submission before it's posted. Businesses with an account can post events directly from their dashboard.">
        Submit an event
      </PageTitle>
      <EventSubmitForm />
    </PageShell>
  );
}

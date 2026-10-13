import type { Metadata } from "next";
import Link from "next/link";
import { getUpcomingEvents } from "@/lib/data";
import { formatEventTime } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description: "Job fairs and community events in Hays and western Kansas.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getUpcomingEvents(SITE.id);
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-12">
      <h1 className="condensed text-[40px] sm:text-[52px]">Events</h1>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-[620px] text-[17px] text-body">Job fairs, hiring events and community happenings around Hays.</p>
        <Link href="/events/submit" className="bg-gold px-5 py-3 font-semibold text-white hover:bg-gold-dark hover:text-white">Submit an event</Link>
      </div>

      <div className="mt-8 border-t-[3px] border-ink" />
      {events.length === 0 ? (
        <p className="py-12 text-[17px] text-body">No upcoming events right now. Know of one? <Link href="/events/submit" className="underline underline-offset-[3px]">Submit it here</Link>.</p>
      ) : (
        <ul>
          {events.map((ev) => (
            <li key={ev.id} className="flex flex-wrap gap-x-10 gap-y-2 border-b border-line py-7">
              <p className="w-[200px] shrink-0 font-mono text-[13px] uppercase tracking-[0.04em] text-gold">
                {formatEventTime(ev.starts_at, ev.all_day)}
              </p>
              <div className="min-w-0 flex-[1_1_480px]">
                <h2 className="text-[22px] font-bold">
                  {ev.title}
                  {ev.is_job_fair && <span className="ml-3 align-middle font-mono text-[11px] uppercase tracking-[0.08em] text-gold">Job fair</span>}
                </h2>
                <p className="mt-1 text-[15px] text-body">
                  {[ev.location_name, ev.address].filter(Boolean).join(" · ")}
                  {ev.employer_id && ev.employer_name && (
                    <> · Hosted by <Link href={`/employers/${ev.employer_id}`} className="underline underline-offset-[3px]">{ev.employer_name}</Link></>
                  )}
                </p>
                {ev.description_html && (
                  <div className="rich-text mt-3 text-[16px]" dangerouslySetInnerHTML={{ __html: sanitizeRichText(ev.description_html) }} />
                )}
                {ev.event_url && (
                  <a href={ev.event_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-block font-semibold underline underline-offset-[3px]">
                    Event details ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

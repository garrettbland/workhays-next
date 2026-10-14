import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getEvent, getUpcomingEvents, type EventDetail } from "@/lib/data";
import { formatEventWhen, isPast } from "@/lib/format";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";
import { assetUrl, SITE } from "@/lib/site";
import { EmployerLogo } from "@/components/EmployerLogo";
import { ShareLinks } from "@/components/ShareLinks";

export async function generateStaticParams() {
  const events = await getUpcomingEvents(SITE.id);
  // Must return at least one param; other events render on first request.
  return events.length ? events.map((e) => ({ id: e.id })) : [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ev = await getEvent(id);
  if (!ev) return { title: "Event not found", robots: { index: false } };
  const when = formatEventWhen(ev.starts_at, ev.ends_at, ev.all_day);
  const description = `${when.date}, ${when.time}${ev.location_name ? ` · ${ev.location_name}` : ""}. ${toPlainText(ev.description_html)}`.slice(0, 200);
  return {
    title: ev.title,
    description,
    alternates: { canonical: `/events/${ev.id}` },
    openGraph: { type: "website", title: ev.title, description, url: `/events/${ev.id}`, siteName: SITE.name },
    twitter: { card: "summary_large_image", title: ev.title, description },
  };
}

export default function EventPage({ params }: PageProps<"/events/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <Link href="/events" className="font-mono text-[13px] text-muted">← All events</Link>
      <Suspense fallback={<div className="mt-6 h-72 animate-pulse bg-wash" aria-hidden="true" />}>
        <EventContent params={params} />
      </Suspense>
    </main>
  );
}

async function EventContent({ params }: Pick<PageProps<"/events/[id]">, "params">) {
  const { id } = await params;
  const ev = await getEvent(id);
  if (!ev) notFound();
  await connection(); // "has this passed?" needs the current time
  const past = isPast(ev.ends_at ?? ev.starts_at);
  const when = formatEventWhen(ev.starts_at, ev.ends_at, ev.all_day);
  const place = [ev.location_name, ev.address].filter(Boolean).join(", ");
  const url = `${SITE.url}/events/${ev.id}`;

  return (
    <div className="mt-6 flex flex-wrap gap-12">
      <article className="min-w-0 flex-[999_1_560px]">
        <p className="mb-2.5 font-mono text-[13px] uppercase tracking-[0.08em] text-gold">
          {ev.is_job_fair ? "Job fair · " : ""}{when.date}
        </p>
        <h1 className="condensed text-[36px] sm:text-[48px]">{ev.title}</h1>
        {past && (
          <p className="mt-4 border-l-[3px] border-line bg-wash px-4 py-3 text-[15px]">
            This event has already happened. <Link href="/events" className="underline underline-offset-[3px]">See upcoming events</Link>.
          </p>
        )}

        <dl className="my-8 grid gap-x-8 gap-y-4 border-y-[3px] border-ink py-6 text-[17px] sm:grid-cols-[120px_1fr]">
          <dt className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted sm:pt-1">When</dt>
          <dd>{when.date}<br />{when.time}</dd>
          {place && (
            <>
              <dt className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted sm:pt-1">Where</dt>
              <dd>
                {ev.location_name}
                {ev.address && <><br />{ev.address}</>}
                <br />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-semibold underline underline-offset-[3px]"
                >
                  Map ↗
                </a>
              </dd>
            </>
          )}
          {ev.employer && (
            <>
              <dt className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted sm:pt-1">Hosted by</dt>
              <dd><Link href={`/employers/${ev.employer.id}`} className="underline underline-offset-[3px]">{ev.employer.name}</Link></dd>
            </>
          )}
        </dl>

        <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichText(ev.description_html) }} />

        <div className="mt-8 flex flex-wrap gap-3">
          {ev.event_url && (
            <a href={ev.event_url} target="_blank" rel="noopener noreferrer nofollow" className="bg-ink px-6 py-3 font-semibold text-white hover:bg-black hover:text-white">
              Event website ↗
            </a>
          )}
          {!past && (
            <a href={`/events/${ev.id}/calendar.ics`} className="border-[1.5px] border-ink px-6 py-[10.5px] font-semibold hover:text-gold">
              Add to calendar
            </a>
          )}
        </div>
      </article>

      <aside className="flex flex-[1_1_280px] flex-col gap-6">
        <section className="border-[1.5px] border-ink p-6">
          <ShareLinks url={url} title={ev.title} />
        </section>
        {ev.employer && (
          <section className="border-[1.5px] border-ink p-6">
            <div className="mb-3"><EmployerLogo src={assetUrl(ev.employer.logo_path)} name={ev.employer.name} size={56} /></div>
            <Link href={`/employers/${ev.employer.id}`} className="font-semibold underline underline-offset-4">Jobs at {ev.employer.name}</Link>
          </section>
        )}
        <Link href={`/contact?event=${ev.id}`} className="text-[14px] text-muted underline underline-offset-[3px]">Report this event</Link>
      </aside>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ev, url) }} />
    </div>
  );
}

function jsonLd(ev: EventDetail, url: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    description: toPlainText(ev.description_html).slice(0, 5000),
    startDate: ev.starts_at,
    ...(ev.ends_at ? { endDate: ev.ends_at } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: ev.location_name ?? SITE.defaultLocation.locality,
      address: ev.address ?? `${SITE.defaultLocation.locality}, ${SITE.defaultLocation.region}`,
    },
    ...(ev.employer ? { organizer: { "@type": "Organization", name: ev.employer.name, url: `${SITE.url}/employers/${ev.employer.id}` } } : {}),
    url,
  }).replace(/</g, "\\u003c");
}

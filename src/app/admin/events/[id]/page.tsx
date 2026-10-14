import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { personName } from "@/lib/admin";
import { isUuid } from "@/lib/data";
import { formatEventWhen, formatLongDate } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { removeEvent, reviewEvent } from "@/app/admin/actions";
import { Loading } from "@/components/ui/Page";
import { StatusBadge } from "@/components/admin/List";

export const metadata: Metadata = { title: "Event · Admin", robots: { index: false } };

export default function AdminEventPage({ params }: PageProps<"/admin/events/[id]">) {
  return (
    <>
      <Link href="/admin/events" className="font-mono text-[13px] text-muted">← All events</Link>
      <Suspense fallback={<Loading />}>
        <EventDetail params={params} />
      </Suspense>
    </>
  );
}

async function EventDetail({ params }: Pick<PageProps<"/admin/events/[id]">, "params">) {
  const { id } = await params;
  await requireStaff(`/admin/events/${id}`);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data: ev, error } = await supabase
    .from("events")
    .select(
      "*, employer:employers(id, name), reviewer:profiles!events_reviewed_by_fkey(first_name, last_name, email), creator:profiles!events_created_by_fkey(first_name, last_name, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!ev) notFound();

  type P = { first_name: string | null; last_name: string | null; email: string } | null;
  const employer = ev.employer as { id: string; name: string } | null;
  const reviewer = ev.reviewer as P;
  const creator = ev.creator as P;
  const when = formatEventWhen(ev.starts_at, ev.ends_at, ev.all_day);
  const status = ev.deleted_at ? "removed" : (ev.status as string);
  const row = "grid gap-1 border-b border-line py-3 sm:grid-cols-[160px_1fr]";
  const label = "font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:pt-1";

  return (
    <div className="mt-6 flex flex-wrap gap-12">
      <article className="min-w-0 flex-[999_1_560px]">
        <StatusBadge status={status} />
        <h1 className="condensed mt-3 text-[34px] sm:text-[44px]">{ev.title}</h1>

        <dl className="mt-6 border-t-[3px] border-ink text-[16px]">
          <div className={row}><dt className={label}>When</dt><dd>{when.date} · {when.time}</dd></div>
          <div className={row}><dt className={label}>Where</dt><dd>{ev.location_name}{ev.address && <><br />{ev.address}</>}</dd></div>
          <div className={row}>
            <dt className={label}>Link</dt>
            <dd>{ev.event_url ? <a href={ev.event_url} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{ev.event_url}</a> : <span className="text-muted">None</span>}</dd>
          </div>
          <div className={row}>
            <dt className={label}>From</dt>
            <dd>
              {employer ? (
                <>Business: <Link href={`/admin/employers/${employer.id}`} className="underline">{employer.name}</Link>{creator && <> (posted by {personName(creator)})</>}</>
              ) : (
                <>Public submission: {ev.submitter_name} · <a href={`mailto:${ev.submitter_email}`} className="underline">{ev.submitter_email}</a></>
              )}
            </dd>
          </div>
          <div className={row}><dt className={label}>Submitted</dt><dd>{formatLongDate(ev.created_at)}</dd></div>
          {ev.reviewed_at && (
            <div className={row}>
              <dt className={label}>Reviewed</dt>
              <dd>{formatLongDate(ev.reviewed_at)}{reviewer && ` by ${personName(reviewer)}`}{ev.review_note && <><br /><span className="text-body">Note: {ev.review_note}</span></>}</dd>
            </div>
          )}
        </dl>

        <h2 className="mt-8 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Description</h2>
        <div className="rich-text mt-2 border-l-[3px] border-line pl-5" dangerouslySetInnerHTML={{ __html: sanitizeRichText(ev.description_html) }} />
      </article>

      <aside className="flex flex-[1_1_300px] flex-col gap-6">
        {!ev.deleted_at && (
          <section className="border-[1.5px] border-ink p-6">
            <h2 className="text-[18px] font-bold">{ev.status === "pending" ? "Review this event" : "Change decision"}</h2>
            <form action={reviewEvent} className="mt-4 flex flex-col gap-3">
              <input type="hidden" name="event_id" value={ev.id} />
              <input type="hidden" name="back" value={ev.status === "pending" ? "/admin" : `/admin/events/${ev.id}`} />
              <label className="flex flex-col gap-1 text-[13px] font-semibold">
                Note {ev.employer_id ? "(saved with the event)" : "(emailed to the submitter if you reject)"}
                <textarea name="note" rows={3} className="border-[1.5px] border-ink px-3 py-2 text-[15px] font-normal" defaultValue={ev.review_note ?? ""} />
              </label>
              <div className="flex flex-wrap gap-2">
                {ev.status !== "approved" && <button name="approve" value="1" className="bg-ink px-4 py-2.5 font-semibold text-white">Approve and post</button>}
                {ev.status !== "rejected" && <button name="approve" value="0" className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c]">Reject</button>}
              </div>
              {!ev.employer_id && <p className="text-[13px] text-muted">We email {ev.submitter_email} either way.</p>}
            </form>
          </section>
        )}
        {ev.status === "approved" && !ev.deleted_at && (
          <Link href={`/events/${ev.id}`} className="font-semibold underline underline-offset-[3px]">View public page ↗</Link>
        )}
        {!ev.deleted_at && (
          <form action={removeEvent}>
            <input type="hidden" name="event_id" value={ev.id} />
            <input type="hidden" name="back" value="/admin/events" />
            <button className="text-[14px] text-[#9b1c1c] underline underline-offset-[3px]">Remove this event</button>
          </form>
        )}
      </aside>
    </div>
  );
}

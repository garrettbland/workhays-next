import { Suspense } from "react";
import { getMyEmployer } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent } from "@/app/dashboard/actions";
import { formatEventTime } from "@/lib/format";
import { EmployerEventForm } from "@/components/dashboard/EventForm";
import { Badge, Loading } from "@/components/ui/Page";

export default function EventsPage({ params }: PageProps<"/dashboard/[employerId]/events">) {
  return (
    <Suspense fallback={<Loading />}>
      <Events params={params} />
    </Suspense>
  );
}

async function Events({ params }: Pick<PageProps<"/dashboard/[employerId]/events">, "params">) {
  const { employerId } = await params;
  const { employer } = await getMyEmployer(employerId, `/dashboard/${employerId}/events`);
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, all_day, location_name, status")
    .eq("employer_id", employer.id)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Your events</h2>
        {!events?.length ? (
          <p className="py-6 text-body">No events yet. Hiring events and job fairs show up on the public Events page.</p>
        ) : (
          <ul>
            {events.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line py-4">
                <span className="min-w-0 flex-[1_1_280px] font-bold">{ev.title}</span>
                <span className="text-[14px] text-muted">{formatEventTime(ev.starts_at, ev.all_day)} · {ev.location_name}</span>
                {ev.status !== "approved" && <Badge tone={ev.status === "pending" ? "gold" : "bad"}>{ev.status}</Badge>}
                <form action={deleteEvent}>
                  <input type="hidden" name="event_id" value={ev.id} />
                  <button type="submit" className="text-[14px] text-[#9b1c1c] underline underline-offset-[3px]">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-6 border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Post an event</h2>
        <EmployerEventForm employerId={employer.id} />
      </section>
    </div>
  );
}

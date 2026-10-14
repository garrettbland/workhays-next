import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams, timeCutoffs } from "@/lib/admin";
import { formatEventTime, formatShortDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultCount, StatusBadge, Table, td, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Events · Admin", robots: { index: false } };

export default function AdminEventsPage({ searchParams }: PageProps<"/admin/events">) {
  return (
    <>
      <h1 className="condensed mb-6 text-[36px] sm:text-[44px]">Events</h1>
      <Suspense fallback={<Loading />}>
        <EventsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EventsList({ searchParams }: Pick<PageProps<"/admin/events">, "searchParams">) {
  await requireStaff("/admin/events");
  await connection();
  const sp = await searchParams;
  const p = listParams(sp);
  const when = (Array.isArray(sp.when) ? sp.when[0] : sp.when) || "upcoming";
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("id, title, starts_at, all_day, status, submitter_name, created_at, deleted_at, employer:employers(name)", { count: "exact" })
    .eq("site_id", SITE.id);
  if (p.status === "removed") query = query.not("deleted_at", "is", null);
  else {
    query = query.is("deleted_at", null);
    if (p.status !== "all") query = query.eq("status", p.status);
  }
  const { now, dayAgo } = timeCutoffs();
  if (when === "upcoming") query = query.gte("starts_at", dayAgo);
  if (when === "past") query = query.lt("starts_at", now);
  if (p.q) query = query.ilike("title", ilike(p.q));
  query = when === "past" ? query.order("starts_at", { ascending: false }) : query.order("starts_at");
  const { data, count, error } = await query.range(p.from, p.to);
  if (error) throw new Error(error.message);

  return (
    <>
      <Toolbar
        q={p.q}
        status={p.status}
        placeholder="Event name"
        statuses={[
          { value: "all", label: "All" },
          { value: "pending", label: "Waiting for review" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "removed", label: "Removed" },
        ]}
        extra={
          <label className="flex flex-col gap-1 text-[13px] font-semibold">
            When
            <select name="when" defaultValue={when} className="h-11 border-[1.5px] border-ink bg-paper px-3 text-[15px] font-normal">
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">Any time</option>
            </select>
          </label>
        }
      />
      <ResultCount count={count ?? 0} page={p.page} />
      <Table head={["Date", "Event", "From", "Status", "Added"]}>
        {(data ?? []).map((ev) => {
          const emp = ev.employer as unknown as { name: string } | null;
          return (
            <tr key={ev.id}>
              <td className={`${td} whitespace-nowrap font-mono text-[13px]`}>{formatEventTime(ev.starts_at, ev.all_day)}</td>
              <td className={td}>
                <Link href={`/admin/events/${ev.id}`} className="font-semibold hover:text-gold">{ev.title}</Link>
              </td>
              <td className={td}>{emp?.name ?? <span className="text-body">{ev.submitter_name} (public)</span>}</td>
              <td className={td}><StatusBadge status={ev.deleted_at ? "removed" : ev.status} /></td>
              <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(ev.created_at)}</td>
            </tr>
          );
        })}
      </Table>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status, when }} />
    </>
  );
}

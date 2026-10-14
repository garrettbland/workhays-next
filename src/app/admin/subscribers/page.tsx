import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams } from "@/lib/admin";
import { formatShortDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultCount, StatusBadge, Table, td, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Subscribers · Admin", robots: { index: false } };

export default function AdminSubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  return (
    <>
      <h1 className="condensed mb-2 text-[36px] sm:text-[44px]">Subscribers</h1>
      <p className="mb-6 text-[16px] text-body">People who get the Monday new-jobs email. Sign-ups confirm by email before they&apos;re added.</p>
      <Suspense fallback={<Loading />}>
        <SubscribersList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SubscribersList({ searchParams }: Pick<PageProps<"/admin/subscribers">, "searchParams">) {
  await requireStaff("/admin/subscribers");
  const p = listParams(await searchParams);
  const supabase = await createClient();
  let query = supabase.from("subscribers").select("id, email, status, source, created_at, confirmed_at, unsubscribed_at", { count: "exact" }).eq("site_id", SITE.id);
  if (p.status !== "all") query = query.eq("status", p.status);
  if (p.q) query = query.ilike("email", ilike(p.q));
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(p.from, p.to);
  if (error) throw new Error(error.message);

  return (
    <>
      <Toolbar
        q={p.q}
        status={p.status}
        placeholder="Email"
        statuses={[
          { value: "all", label: "All" },
          { value: "confirmed", label: "Confirmed" },
          { value: "pending", label: "Not confirmed yet" },
          { value: "unsubscribed", label: "Unsubscribed" },
        ]}
      />
      <ResultCount count={count ?? 0} page={p.page} />
      <Table head={["Email", "Status", "From", "Signed up", "Confirmed / left"]}>
        {(data ?? []).map((s) => (
          <tr key={s.id}>
            <td className={td}>{s.email}</td>
            <td className={td}><StatusBadge status={s.status} /></td>
            <td className={`${td} text-body`}>{s.source ?? ""}</td>
            <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(s.created_at)}</td>
            <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(s.unsubscribed_at ?? s.confirmed_at)}</td>
          </tr>
        ))}
      </Table>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status }} />
    </>
  );
}

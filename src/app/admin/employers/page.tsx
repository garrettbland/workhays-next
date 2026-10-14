import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams, personName } from "@/lib/admin";
import { formatShortDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultCount, StatusBadge, Table, td, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Employers · Admin", robots: { index: false } };

export default function AdminEmployersPage({ searchParams }: PageProps<"/admin/employers">) {
  return (
    <>
      <h1 className="condensed mb-6 text-[36px] sm:text-[44px]">Employers</h1>
      <Suspense fallback={<Loading />}>
        <EmployersList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EmployersList({ searchParams }: Pick<PageProps<"/admin/employers">, "searchParams">) {
  await requireStaff("/admin/employers");
  const p = listParams(await searchParams);
  const supabase = await createClient();
  let query = supabase
    .from("employers")
    .select(
      "id, name, email, status, created_at, members:employer_members(role, profile:profiles!employer_members_user_id_fkey(first_name, last_name, email)), jobs(count)",
      { count: "exact" },
    )
    .eq("site_id", SITE.id)
    .eq("jobs.status", "active");
  if (p.status !== "all") query = query.eq("status", p.status);
  if (p.q) query = query.or(`name.ilike.${ilike(p.q)},email.ilike.${ilike(p.q)}`);
  const { data, count, error } = await query.order("name").range(p.from, p.to);
  if (error) throw new Error(error.message);

  type Member = { role: string; profile: { first_name: string | null; last_name: string | null; email: string } | null };
  return (
    <>
      <Toolbar
        q={p.q}
        status={p.status}
        placeholder="Business name or email"
        statuses={[
          { value: "all", label: "All" },
          { value: "pending", label: "Waiting for approval" },
          { value: "approved", label: "Approved" },
          { value: "suspended", label: "Suspended" },
          { value: "denied", label: "Denied" },
        ]}
      />
      <ResultCount count={count ?? 0} page={p.page} />
      <Table head={["Business", "Owner", "Team", "Active jobs", "Status", "Joined"]}>
        {(data ?? []).map((e) => {
          const members = (e.members ?? []) as unknown as Member[];
          const owner = members.find((m) => m.role === "owner")?.profile;
          const activeJobs = (e.jobs as unknown as { count: number }[])[0]?.count ?? 0;
          return (
            <tr key={e.id}>
              <td className={td}><Link href={`/admin/employers/${e.id}`} className="font-semibold hover:text-gold">{e.name}</Link></td>
              <td className={td}>{owner ? <>{personName(owner)}<br /><span className="text-[13px] text-body">{owner.email}</span></> : <span className="text-muted">None</span>}</td>
              <td className={td}>{members.length}</td>
              <td className={td}>{activeJobs}</td>
              <td className={td}><StatusBadge status={e.status} /></td>
              <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(e.created_at)}</td>
            </tr>
          );
        })}
      </Table>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status }} />
    </>
  );
}

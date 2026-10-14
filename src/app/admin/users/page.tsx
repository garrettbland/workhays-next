import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams, personName } from "@/lib/admin";
import { formatShortDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultBanner, ResultCount, StatusBadge, Table, td, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Users · Admin", robots: { index: false } };

export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <h1 className="condensed mb-6 text-[36px] sm:text-[44px]">Users</h1>
      <Suspense fallback={<Loading />}>
        <UsersList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersList({ searchParams }: Pick<PageProps<"/admin/users">, "searchParams">) {
  await requireStaff("/admin/users");
  const sp = await searchParams;
  const p = listParams(sp);
  const supabase = await createClient();

  const members = p.status === "business" ? "employer_members!employer_members_user_id_fkey!inner" : "employer_members!employer_members_user_id_fkey";
  const staff = p.status === "staff" ? "site_staff!inner" : "site_staff";
  let query = supabase
    .from("profiles")
    .select(`id, first_name, last_name, email, created_at, ${members}(role, employer:employers(id, name, site_id)), ${staff}(role, site_id)`, { count: "exact" });
  if (p.status === "none") query = query.is("employer_members", null).is("site_staff", null);
  if (p.q) query = query.or(`email.ilike.${ilike(p.q)},first_name.ilike.${ilike(p.q)},last_name.ilike.${ilike(p.q)}`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(p.from, p.to);
  if (error) throw new Error(error.message);

  type Row = {
    id: string; first_name: string | null; last_name: string | null; email: string; created_at: string;
    employer_members: { role: string; employer: { id: string; name: string; site_id: string } | null }[];
    site_staff: { role: string; site_id: string }[];
  };
  return (
    <>
      <ResultBanner sp={sp} />
      <Toolbar
        q={p.q}
        status={p.status}
        placeholder="Name or email"
        statuses={[
          { value: "all", label: "Everyone" },
          { value: "business", label: "On a business team" },
          { value: "staff", label: "Staff" },
          { value: "none", label: "No business yet" },
        ]}
      />
      <ResultCount count={count ?? 0} page={p.page} />
      <Table head={["Name", "Email", "Businesses", "Staff", "Joined"]}>
        {((data ?? []) as unknown as Row[]).map((u) => {
          const role = u.site_staff.find((s) => s.site_id === SITE.id)?.role;
          const businesses = u.employer_members.filter((m) => m.employer?.site_id === SITE.id);
          return (
            <tr key={u.id}>
              <td className={td}><Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-gold">{personName(u)}</Link></td>
              <td className={td}><a href={`mailto:${u.email}`} className="underline">{u.email}</a></td>
              <td className={td}>
                {businesses.length ? businesses.map((m, i) => (
                  <span key={m.employer!.id}>
                    {i > 0 && ", "}
                    <Link href={`/admin/employers/${m.employer!.id}`} className="underline underline-offset-[3px]">{m.employer!.name}</Link>
                    <span className="text-[13px] text-muted"> ({m.role})</span>
                  </span>
                )) : <span className="text-muted">None</span>}
              </td>
              <td className={td}>{role && <StatusBadge status={role} />}</td>
              <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(u.created_at)}</td>
            </tr>
          );
        })}
      </Table>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status }} />
    </>
  );
}

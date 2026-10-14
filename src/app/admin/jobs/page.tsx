import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams } from "@/lib/admin";
import { formatShortDate, JOB_TYPE_LABELS } from "@/lib/format";
import { SITE } from "@/lib/site";
import { closeJobAsStaff } from "@/app/admin/actions";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultCount, StatusBadge, Table, td, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Jobs · Admin", robots: { index: false } };

export default function AdminJobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  return (
    <>
      <h1 className="condensed mb-6 text-[36px] sm:text-[44px]">Jobs</h1>
      <Suspense fallback={<Loading />}>
        <JobsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function JobsList({ searchParams }: Pick<PageProps<"/admin/jobs">, "searchParams">) {
  await requireStaff("/admin/jobs");
  const p = listParams(await searchParams, "active");
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("id, title, job_type, status, published_at, bumped_at, expires_at, auto_renew, featured_until, employer:employers!inner(id, name)", { count: "exact" })
    .eq("site_id", SITE.id)
    .is("deleted_at", null);
  if (p.status !== "all") query = query.eq("status", p.status);
  if (p.q) {
    // Title, or the business name
    const { data: emps } = await supabase.from("employers").select("id").eq("site_id", SITE.id).ilike("name", ilike(p.q)).limit(200);
    const ids = (emps ?? []).map((e) => e.id);
    query = ids.length ? query.or(`title.ilike.${ilike(p.q)},employer_id.in.(${ids.join(",")})`) : query.ilike("title", ilike(p.q));
  }
  const order = p.status === "active" ? "bumped_at" : "created_at";
  const { data, count, error } = await query.order(order, { ascending: false, nullsFirst: false }).range(p.from, p.to);
  if (error) throw new Error(error.message);

  return (
    <>
      <Toolbar
        q={p.q}
        status={p.status}
        placeholder="Job title or business"
        statuses={[
          { value: "active", label: "Live" },
          { value: "draft", label: "Drafts" },
          { value: "expired", label: "Expired" },
          { value: "filled", label: "Filled" },
          { value: "archived", label: "Taken down" },
          { value: "all", label: "All" },
        ]}
      />
      <ResultCount count={count ?? 0} page={p.page} />
      <Table head={["Job", "Business", "Type", "Status", "Posted", "Expires", ""]}>
        {(data ?? []).map((j) => {
          const emp = j.employer as unknown as { id: string; name: string };
          return (
            <tr key={j.id}>
              <td className={td}>
                {j.status === "active" ? <Link href={`/jobs/${j.id}`} className="font-semibold hover:text-gold">{j.title}</Link> : <span className="font-semibold">{j.title}</span>}
                {j.auto_renew && <span className="ml-2 font-mono text-[11px] uppercase text-muted">auto-renew</span>}
              </td>
              <td className={td}><Link href={`/admin/employers/${emp.id}`} className="underline underline-offset-[3px]">{emp.name}</Link></td>
              <td className={`${td} whitespace-nowrap`}>{JOB_TYPE_LABELS[j.job_type] ?? j.job_type}</td>
              <td className={td}><StatusBadge status={j.status === "archived" ? "taken down" : j.status} /></td>
              <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(j.bumped_at ?? j.published_at)}</td>
              <td className={`${td} whitespace-nowrap text-body`}>{formatShortDate(j.expires_at)}</td>
              <td className={`${td} text-right`}>
                {j.status === "active" && (
                  <form action={closeJobAsStaff}>
                    <input type="hidden" name="job_id" value={j.id} />
                    <button className="whitespace-nowrap text-[14px] text-[#9b1c1c] underline underline-offset-[3px]">Take down</button>
                  </form>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status }} />
    </>
  );
}

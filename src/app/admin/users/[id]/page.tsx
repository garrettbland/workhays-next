import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { personName } from "@/lib/admin";
import { isUuid } from "@/lib/data";
import { formatLongDate, formatShortDate, isPast } from "@/lib/format";
import { SITE } from "@/lib/site";
import {
  deleteUser, resetTwoFactor, sendPasswordReset, setBlocked, setMembership, setStaffRole, updateUserDetails,
} from "@/app/admin/users/actions";
import { Loading } from "@/components/ui/Page";
import { ResultBanner, SectionTitle, StatusBadge, Table, td } from "@/components/admin/List";

export const metadata: Metadata = { title: "User · Admin", robots: { index: false } };

export default function AdminUserPage({ params, searchParams }: PageProps<"/admin/users/[id]">) {
  return (
    <>
      <Link href="/admin/users" className="font-mono text-[13px] text-muted">← All users</Link>
      <Suspense fallback={<Loading />}>
        <UserDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: SITE.timezone });
const input = "h-11 border-[1.5px] border-ink px-3 text-[15px] font-normal";
const label = "flex flex-col gap-1 text-[13px] font-semibold";
const panel = "flex flex-col gap-3 border-[1.5px] border-ink p-6";

async function UserDetail({ params, searchParams }: Pick<PageProps<"/admin/users/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const sp = await searchParams;
  const staff = await requireStaff(`/admin/users/${id}`);
  if (!isUuid(id)) notFound();
  const isAdmin = staff.role === "admin";
  const supabase = await createClient();
  const [{ data: profile }, { data: memberships }, { data: staffRow }, { data: jobs }, { data: history }, auth] = await Promise.all([
    supabase.from("profiles").select("id, email, first_name, last_name, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("employer_members")
      .select("role, created_at, employer:employers(id, name, status, site_id)")
      .eq("user_id", id)
      .order("created_at"),
    supabase.from("site_staff").select("role").eq("site_id", SITE.id).eq("user_id", id).maybeSingle(),
    supabase.from("jobs").select("id, title, status, created_at").eq("site_id", SITE.id).eq("created_by", id).order("created_at", { ascending: false }).limit(10),
    supabase
      .from("audit_log")
      .select("id, action, created_at, data, actor:profiles!audit_log_actor_id_fkey(first_name, last_name, email)")
      .eq("entity_type", "user")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    createAdminClient().auth.admin.getUserById(id),
  ]);
  if (!profile) notFound();

  const account = auth.data.user;
  const blocked = !!account?.banned_until && !isPast(account.banned_until);
  const twoFactor = (account?.factors ?? []).some((f) => f.status === "verified");
  const isSelf = staff.id === id;
  type Membership = { role: string; created_at: string; employer: { id: string; name: string; status: string; site_id: string } | null };
  const teams = ((memberships ?? []) as unknown as Membership[]).filter((m) => m.employer?.site_id === SITE.id);
  const row = "grid gap-1 border-b border-line py-3 sm:grid-cols-[150px_1fr]";
  const dt = "font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:pt-1";

  return (
    <div className="mt-6">
      <ResultBanner sp={sp} />
      <div className="flex flex-wrap items-center gap-3">
        {staffRow && <StatusBadge status={staffRow.role} />}
        {blocked && <StatusBadge status="blocked" />}
        {isSelf && <span className="text-[14px] text-muted">This is you</span>}
      </div>
      <h1 className="condensed mt-3 text-[34px] sm:text-[44px]">{personName(profile)}</h1>

      <div className="mt-6 flex flex-wrap gap-12">
        <div className="min-w-0 flex-[999_1_560px]">
          <dl className="border-t-[3px] border-ink text-[16px]">
            <div className={row}><dt className={dt}>Email</dt><dd><a href={`mailto:${profile.email}`} className="underline">{profile.email}</a>{account?.email_confirmed_at ? "" : <span className="ml-2 text-[13px] text-[#7a1616]">not confirmed</span>}</dd></div>
            <div className={row}><dt className={dt}>Joined</dt><dd>{formatLongDate(profile.created_at)}</dd></div>
            <div className={row}><dt className={dt}>Last sign-in</dt><dd>{account?.last_sign_in_at ? when.format(new Date(account.last_sign_in_at)) : <span className="text-muted">Never on the new site</span>}</dd></div>
            <div className={row}><dt className={dt}>Two-factor</dt><dd>{twoFactor ? "On" : "Off"}</dd></div>
            <div className={row}><dt className={dt}>Sign-in</dt><dd>{blocked ? <span className="text-[#7a1616]">Blocked</span> : "Allowed"}</dd></div>
          </dl>

          <section className="mt-10">
            <SectionTitle>Businesses ({teams.length})</SectionTitle>
            {teams.length === 0 ? <p className="py-4 text-body">Not on any business team.</p> : (
              <Table head={["Business", "Status", "Role", "Since"]}>
                {teams.map((m) => (
                  <tr key={m.employer!.id}>
                    <td className={td}><Link href={`/admin/employers/${m.employer!.id}`} className="font-semibold hover:text-gold">{m.employer!.name}</Link></td>
                    <td className={td}><StatusBadge status={m.employer!.status} /></td>
                    <td className={td}>
                      {isAdmin ? (
                        <form action={setMembership} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="user_id" value={id} />
                          <input type="hidden" name="employer_id" value={m.employer!.id} />
                          <select name="role" defaultValue={m.role} aria-label={`Role at ${m.employer!.name}`} className="h-9 border-[1.5px] border-ink bg-paper px-2 text-[14px]">
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            {m.role !== "owner" && <option value="remove">Remove from business</option>}
                          </select>
                          <button className="text-[14px] font-semibold underline underline-offset-[3px]">Save</button>
                        </form>
                      ) : <span className="capitalize">{m.role}</span>}
                    </td>
                    <td className={`${td} text-body`}>{formatShortDate(m.created_at)}</td>
                  </tr>
                ))}
              </Table>
            )}
            {isAdmin && <p className="mt-2 text-[13px] text-muted">To add them to another business, use “Add a team member” on that business&apos;s admin page.</p>}
          </section>

          {!!jobs?.length && (
            <section className="mt-10">
              <SectionTitle>Jobs they posted (latest {jobs.length})</SectionTitle>
              <Table head={["Job", "Status", "Created"]}>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td className={td}><Link href={`/admin/jobs/${j.id}`} className="font-semibold hover:text-gold">{j.title}</Link></td>
                    <td className={td}><StatusBadge status={j.status} /></td>
                    <td className={`${td} text-body`}>{formatShortDate(j.created_at)}</td>
                  </tr>
                ))}
              </Table>
            </section>
          )}

          {!!history?.length && (
            <section className="mt-10">
              <SectionTitle>Admin history</SectionTitle>
              <ul className="text-[14px]">
                {history.map((h) => {
                  const actor = h.actor as unknown as { first_name: string | null; last_name: string | null; email: string } | null;
                  return (
                    <li key={h.id} className="border-b border-line py-2">
                      <span className="text-body">{when.format(new Date(h.created_at))}</span> · {HISTORY[h.action] ?? h.action}
                      {actor && <span className="text-body"> by {personName(actor)}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-[1_1_320px] flex-col gap-6">
          {!isAdmin ? (
            <p className="border-l-[3px] border-line bg-wash px-4 py-3 text-[15px]">Only site admins can change user accounts.</p>
          ) : (
            <>
              <form action={updateUserDetails} className={panel}>
                <input type="hidden" name="user_id" value={id} />
                <h2 className="text-[18px] font-bold">Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className={label}>First name<input name="first_name" defaultValue={profile.first_name ?? ""} className={input} /></label>
                  <label className={label}>Last name<input name="last_name" defaultValue={profile.last_name ?? ""} className={input} /></label>
                </div>
                <label className={label}>Email<input name="email" type="email" required defaultValue={profile.email} className={input} /></label>
                <p className="text-[13px] text-muted">An email change takes effect right away; they sign in with the new address.</p>
                <div><button className="bg-ink px-4 py-2.5 font-semibold text-white">Save details</button></div>
              </form>

              <form action={setStaffRole} className={panel}>
                <input type="hidden" name="user_id" value={id} />
                <h2 className="text-[18px] font-bold">Staff access</h2>
                <label className={label}>
                  Role on {SITE.name}
                  <select name="role" defaultValue={staffRow?.role ?? "none"} className={`${input} bg-paper`}>
                    <option value="none">Not staff</option>
                    <option value="moderator">Moderator: approvals, events, messages, jobs</option>
                    <option value="admin">Admin: everything, including users</option>
                  </select>
                </label>
                <div><button className="border-[1.5px] border-ink px-4 py-2 font-semibold hover:text-gold">Save role</button></div>
              </form>

              <section className={panel}>
                <h2 className="text-[18px] font-bold">Sign-in help</h2>
                <form action={sendPasswordReset}>
                  <input type="hidden" name="user_id" value={id} />
                  <button className="text-[15px] font-semibold underline underline-offset-[3px]">Email them a password reset link</button>
                </form>
                {twoFactor && (
                  <form action={resetTwoFactor}>
                    <input type="hidden" name="user_id" value={id} />
                    <button className="text-[15px] font-semibold underline underline-offset-[3px]">Reset two-factor (lost phone)</button>
                  </form>
                )}
                {!isSelf && (
                  <form action={setBlocked}>
                    <input type="hidden" name="user_id" value={id} />
                    <input type="hidden" name="block" value={blocked ? "0" : "1"} />
                    <button className={`text-[15px] font-semibold underline underline-offset-[3px] ${blocked ? "" : "text-[#9b1c1c]"}`}>
                      {blocked ? "Unblock sign-in" : "Block sign-in"}
                    </button>
                  </form>
                )}
              </section>

              {!isSelf && (
                <details className="border-[1.5px] border-[#9b1c1c] p-6">
                  <summary className="font-semibold text-[#9b1c1c]">Delete account</summary>
                  <form action={deleteUser} className="mt-4 flex flex-col gap-3">
                    <input type="hidden" name="user_id" value={id} />
                    <p className="text-[14px]">Permanently deletes the account. Jobs they posted stay with their business. Not possible while they own a business.</p>
                    <label className={label}>Type <span className="font-mono">{profile.email}</span> to confirm<input name="confirm" autoComplete="off" className={input} /></label>
                    <div><button className="border-[1.5px] border-[#9b1c1c] px-4 py-2 font-semibold text-[#9b1c1c] hover:bg-[#fdf2f2]">Delete forever</button></div>
                  </form>
                </details>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

const HISTORY: Record<string, string> = {
  "user.updated": "Details changed",
  "user.staff_role": "Staff role changed",
  "user.membership": "Business role changed",
  "user.password_reset_sent": "Password reset sent",
  "user.2fa_reset": "Two-factor reset",
  "user.blocked": "Blocked",
  "user.unblocked": "Unblocked",
};

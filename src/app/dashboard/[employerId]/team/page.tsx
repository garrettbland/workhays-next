import { Suspense } from "react";
import { getMyEmployer, type MemberRole } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { changeRole, removeMember, resendInvite, revokeInvite, transferOwnership } from "@/app/dashboard/actions";
import { formatShortDate } from "@/lib/format";
import { InviteForm } from "@/components/dashboard/InviteForm";
import { Badge, Loading } from "@/components/ui/Page";

export default function TeamPage({ params }: PageProps<"/dashboard/[employerId]/team">) {
  return (
    <Suspense fallback={<Loading />}>
      <Team params={params} />
    </Suspense>
  );
}

const ROLE_HELP: Record<MemberRole, string> = {
  owner: "Everything, including team and ownership",
  admin: "Jobs, events, business profile and team members",
  member: "Jobs and events",
};

async function Team({ params }: Pick<PageProps<"/dashboard/[employerId]/team">, "params">) {
  const { employerId } = await params;
  const { user, employer, role, canManage } = await getMyEmployer(employerId, `/dashboard/${employerId}/team`);
  const supabase = await createClient();
  const [{ data: members, error: membersError }, { data: invites }] = await Promise.all([
    supabase
      .from("employer_members")
      .select("user_id, role, created_at, profile:profiles!employer_members_user_id_fkey(first_name, last_name, email)")
      .eq("employer_id", employer.id)
      .order("created_at"),
    canManage
      ? supabase
          .from("employer_invites")
          .select("id, email, role, expires_at, created_at")
          .eq("employer_id", employer.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  if (membersError) throw new Error(`Team failed to load: ${membersError.message}`);
  type Member = { user_id: string; role: MemberRole; profile: { first_name: string | null; last_name: string | null; email: string } | null };
  const list = (members ?? []) as unknown as Member[];
  const order: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2 };
  list.sort((a, b) => order[a.role] - order[b.role]);
  const hidden = (userId: string) => (
    <>
      <input type="hidden" name="employer_id" value={employer.id} />
      <input type="hidden" name="user_id" value={userId} />
    </>
  );

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Team ({list.length})</h2>
        <ul>
          {list.map((m) => {
            const name = [m.profile?.first_name, m.profile?.last_name].filter(Boolean).join(" ") || m.profile?.email || "Team member";
            const isMe = m.user_id === user.id;
            const canRemove = !isMe && m.role !== "owner" && (role === "owner" || (role === "admin" && m.role === "member"));
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line py-4">
                <span className="min-w-0 flex-[1_1_280px]">
                  <span className="block font-bold">{name}{isMe && <span className="font-normal text-muted"> (you)</span>}</span>
                  <span className="block truncate text-[14px] text-muted">{m.profile?.email}</span>
                </span>
                <span className="w-[260px]">
                  <Badge tone={m.role === "owner" ? "gold" : "neutral"}>{m.role}</Badge>
                  <span className="mt-1 block text-[13px] text-muted">{ROLE_HELP[m.role]}</span>
                </span>
                <span className="flex flex-wrap items-center gap-4 text-[14px]">
                  {role === "owner" && m.role !== "owner" && (
                    <>
                      <form action={changeRole}>
                        {hidden(m.user_id)}
                        <input type="hidden" name="role" value={m.role === "admin" ? "member" : "admin"} />
                        <button type="submit" className="underline underline-offset-[3px] hover:text-gold">{m.role === "admin" ? "Make member" : "Make admin"}</button>
                      </form>
                      <form action={transferOwnership}>
                        {hidden(m.user_id)}
                        <button type="submit" className="underline underline-offset-[3px] hover:text-gold">Make owner</button>
                      </form>
                    </>
                  )}
                  {canRemove && (
                    <form action={removeMember}>
                      {hidden(m.user_id)}
                      <button type="submit" className="text-[#9b1c1c] underline underline-offset-[3px]">Remove</button>
                    </form>
                  )}
                  {isMe && m.role !== "owner" && (
                    <form action={removeMember}>
                      {hidden(m.user_id)}
                      <button type="submit" className="text-[#9b1c1c] underline underline-offset-[3px]">Leave team</button>
                    </form>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {role === "owner" && (
          <p className="mt-3 text-[13px] text-muted">To leave this business, make someone else the owner first.</p>
        )}
      </section>

      {canManage && (
        <>
          <section>
            <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Invite someone</h2>
            <p className="mb-4 max-w-[640px] text-[15px] text-body">
              They&apos;ll get an email with a link to accept or decline. Invites expire after 7 days.
            </p>
            <InviteForm employerId={employer.id} canInviteAdmins={role === "owner"} />
          </section>

          {(invites ?? []).length > 0 && (
            <section>
              <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Pending invites</h2>
              <ul>
                {(invites ?? []).map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line py-4">
                    <span className="min-w-0 flex-[1_1_280px] font-semibold">{i.email}</span>
                    <span className="w-[260px] text-[14px] text-muted"><Badge>{i.role}</Badge> Expires {formatShortDate(i.expires_at)}</span>
                    <span className="flex gap-4 text-[14px]">
                      <form action={resendInvite}>
                        <input type="hidden" name="employer_id" value={employer.id} />
                        <input type="hidden" name="email" value={i.email} />
                        <input type="hidden" name="role" value={i.role} />
                        <button type="submit" className="underline underline-offset-[3px] hover:text-gold">Resend</button>
                      </form>
                      <form action={revokeInvite}>
                        <input type="hidden" name="invite_id" value={i.id} />
                        <button type="submit" className="text-[#9b1c1c] underline underline-offset-[3px]">Cancel invite</button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

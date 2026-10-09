import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatLongDate } from "@/lib/format";
import { InviteResponse } from "@/components/dashboard/InviteResponse";
import { Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Team invitation", robots: { index: false } };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <PageShell narrow>
      <Suspense fallback={<Loading />}>
        <Invite params={params} />
      </Suspense>
    </PageShell>
  );
}

type Invite = {
  employer_name: string;
  invited_by_name: string | null;
  role: "admin" | "member";
  email: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expires_at: string;
};

async function Invite({ params }: Pick<PageProps<"/invite/[token]">, "params">) {
  const { token } = await params;
  const supabase = await createClient();
  const [{ data }, user] = await Promise.all([supabase.rpc("get_employer_invite", { p_token: token }), getUser()]);
  const invite = (data as Invite[] | null)?.[0];

  if (!invite) {
    return <PageTitle sub="This invite link isn't valid. Ask the person who invited you to send a new one.">Invite not found</PageTitle>;
  }
  if (invite.status !== "pending") {
    const msg = {
      accepted: "This invite has already been accepted.",
      declined: "This invite was declined.",
      revoked: "This invite was cancelled.",
      expired: "This invite has expired. Ask for a new one.",
    }[invite.status];
    return (
      <>
        <PageTitle sub={msg}>Invite to {invite.employer_name}</PageTitle>
        {invite.status === "accepted" && <Link href="/dashboard" className="font-semibold underline underline-offset-[3px]">Go to your dashboard</Link>}
      </>
    );
  }

  const who = invite.invited_by_name ?? "A teammate";
  const roleText = invite.role === "admin" ? "an admin (jobs, events, profile and team)" : "a team member (jobs and events)";
  const next = `/invite/${token}`;

  return (
    <>
      <PageTitle sub={`${who} invited you to join ${invite.employer_name} on Work Hays as ${roleText}.`}>
        Join {invite.employer_name}
      </PageTitle>
      <p className="mb-6 text-[14px] text-muted">Sent to {invite.email} · expires {formatLongDate(invite.expires_at)}</p>

      {!user ? (
        <div className="flex flex-col gap-4">
          <p className="text-[16px]">Sign in or create an account with <strong>{invite.email}</strong> to respond.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="bg-gold px-5 py-3 font-semibold text-white hover:bg-gold-dark hover:text-white">Create account</Link>
            <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="border-[1.5px] border-ink px-5 py-[10.5px] font-semibold">Sign in</Link>
          </div>
        </div>
      ) : user.email.toLowerCase() !== invite.email ? (
        <div className="border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
          You&apos;re signed in as {user.email}, but this invite was sent to {invite.email}.{" "}
          <form action="/sign-out" method="post" className="inline">
            <button type="submit" className="font-semibold underline underline-offset-[3px]">Sign out</button>
          </form>{" "}
          and sign in with the invited email to respond.
        </div>
      ) : (
        <InviteResponse token={token} employerName={invite.employer_name} />
      )}
    </>
  );
}

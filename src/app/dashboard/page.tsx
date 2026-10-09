import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardPage() {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </PageShell>
  );
}

const STATUS: Record<string, { label: string; tone: "good" | "gold" | "bad" | "neutral" }> = {
  approved: { label: "Live", tone: "good" },
  pending: { label: "Waiting for approval", tone: "gold" },
  denied: { label: "Not approved", tone: "bad" },
  suspended: { label: "Suspended", tone: "bad" },
};

async function Dashboard() {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const [{ data: memberships, error }, { data: invites }, { data: profile }, { data: staff }] = await Promise.all([
    supabase
      .from("employer_members")
      .select("role, employer:employers(id, name, status)")
      .eq("user_id", user.id),
    supabase
      .from("employer_invites")
      .select("id, role, employer:employers(name)")
      .eq("email", user.email.toLowerCase())
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString()),
    supabase.from("profiles").select("first_name").eq("id", user.id).single(),
    supabase.from("site_staff").select("role").eq("user_id", user.id).maybeSingle(),
  ]);

  if (error) throw new Error(`Dashboard failed to load: ${error.message}`);
  type Membership = { role: string; employer: { id: string; name: string; status: string } };
  const list = ((memberships ?? []) as unknown as Membership[]).sort((a, b) => a.employer.name.localeCompare(b.employer.name));
  if (list.length === 1 && !invites?.length && !staff) {
    // Most people manage a single business: take them straight to it.
    redirect(`/dashboard/${list[0].employer.id}`);
  }

  return (
    <>
      <PageTitle sub={profile?.first_name ? `Welcome back, ${profile.first_name}.` : undefined}>Your businesses</PageTitle>

      {staff && (
        <p className="mb-8 border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
          You&apos;re a site {staff.role}. <Link href="/admin" className="font-semibold underline underline-offset-[3px]">Open the admin queue</Link>
        </p>
      )}

      {(invites ?? []).length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-mono text-[13px] uppercase tracking-[0.08em]">Invitations</h2>
          <p className="text-[15px] text-body">You have pending team invitations. Open the link in your invite email to accept or decline.</p>
        </section>
      )}

      {list.length === 0 ? (
        <div className="py-6">
          <p className="text-[18px] font-bold">You&apos;re not part of a business yet.</p>
          <p className="mt-2 text-body">Add your business to start posting jobs. If a coworker already set it up, ask them to invite you.</p>
        </div>
      ) : (
        <ul className="border-t border-line">
          {list.map(({ role, employer }) => (
            <li key={employer.id} className="border-b border-line">
              <Link href={`/dashboard/${employer.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
                <span className="min-w-0 flex-[1_1_320px] text-[19px] font-bold">{employer.name}</span>
                <Badge tone={STATUS[employer.status]?.tone ?? "neutral"}>{STATUS[employer.status]?.label ?? employer.status}</Badge>
                <span className="w-[80px] text-[14px] capitalize text-muted">{role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/new" className="bg-gold px-5 py-3 font-semibold text-white hover:bg-gold-dark hover:text-white">
          Add a business
        </Link>
        <Link href="/account" className="border-[1.5px] border-ink px-5 py-[10.5px] font-semibold">Account &amp; security</Link>
      </div>
    </>
  );
}

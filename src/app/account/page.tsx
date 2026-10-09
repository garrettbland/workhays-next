import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { removeTotp } from "@/app/account/actions";
import { ContinueTo, NameForm, PasswordForm, TotpSetup } from "@/components/AccountForms";
import { Badge, Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Account searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Account({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  const sp = await searchParams;
  const user = await requireUser("/account");
  const supabase = await createClient();
  const [{ data: profile }, { data: factors }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single(),
    supabase.auth.mfa.listFactors(),
  ]);
  const totp = factors?.totp?.find((f) => f.status === "verified");
  const mustSetup = sp.setup2fa === "1";
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;

  return (
    <>
      <div className="mb-4 font-mono text-[13px] text-muted"><Link href="/dashboard">← Dashboard</Link></div>
      <PageTitle sub={user.email}>Account &amp; security</PageTitle>

      {mustSetup && totp && next && <ContinueTo href={next} />}
      {mustSetup && !totp && (
        <p className="mb-8 border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
          Staff accounts need two-factor authentication. Set it up below to open the admin area.
        </p>
      )}

      <div className="flex max-w-[760px] flex-col gap-12">
        <section>
          <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Your name</h2>
          <NameForm first={profile?.first_name ?? ""} last={profile?.last_name ?? ""} />
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-3 border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">
            Two-factor authentication {totp ? <Badge tone="good">On</Badge> : <Badge>Off</Badge>}
          </h2>
          {totp ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[15px] text-body">You&apos;ll enter a code from your authenticator app when you sign in.</p>
              <form action={removeTotp}>
                <input type="hidden" name="factor_id" value={totp.id} />
                <button type="submit" className="text-[14px] text-[#9b1c1c] underline underline-offset-[3px]">Turn off</button>
              </form>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[15px] text-body">Adds a 6-digit code from your phone when you sign in, so a stolen password isn&apos;t enough.</p>
              <TotpSetup next={mustSetup ? next : undefined} />
            </>
          )}
        </section>

        <section>
          <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">Password</h2>
          <PasswordForm />
        </section>

        <form action="/sign-out" method="post">
          <button type="submit" className="border-[1.5px] border-ink px-5 py-[10.5px] font-semibold">Sign out</button>
        </form>
      </div>
    </>
  );
}

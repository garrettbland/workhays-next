"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { changePassword, confirmTotp, startTotp, updateName, type EnrollState } from "@/app/account/actions";
import { Field, Input } from "@/components/ui/Field";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";

export function NameForm({ first, last }: { first: string; last: string }) {
  const [state, action] = useActionState(updateName, undefined);
  return (
    <ActionForm action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="first_name"><Input id="first_name" name="first_name" defaultValue={first} required /></Field>
        <Field label="Last name" htmlFor="last_name"><Input id="last_name" name="last_name" defaultValue={last} /></Field>
      </div>
      <FormMessage state={state} />
      <div><SubmitButton variant="secondary" pendingLabel="Saving…">Save name</SubmitButton></div>
    </ActionForm>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <ActionForm action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /></Field>
        <Field label="Confirm" htmlFor="confirm"><Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required /></Field>
      </div>
      <FormMessage state={state} />
      <div><SubmitButton variant="secondary" pendingLabel="Saving…">Change password</SubmitButton></div>
    </ActionForm>
  );
}

export function TotpSetup({ next }: { next?: string }) {
  const [enroll, setEnroll] = useState<EnrollState>(undefined);
  const [pending, start] = useTransition();
  const [state, action] = useActionState(confirmTotp, undefined);
  useEffect(() => {
    if (state?.next) window.location.assign(state.next);
  }, [state]);

  if (state?.ok) return <FormMessage state={state} />;
  if (!enroll?.factorId) {
    return (
      <div className="flex flex-col gap-3">
        {enroll?.error && <FormMessage state={{ error: enroll.error }} />}
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => setEnroll(await startTotp()))}
            className="bg-gold px-5 py-3 font-semibold text-white hover:bg-gold-dark disabled:opacity-60"
          >
            {pending ? "Starting…" : "Set up two-factor"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <ActionForm action={action} className="flex flex-col gap-4">
      <input type="hidden" name="factor_id" value={enroll.factorId} />
      {next && <input type="hidden" name="next" value={next} />}
      <ol className="list-decimal space-y-2 pl-5 text-[15px]">
        <li>Open an authenticator app (Google Authenticator, 1Password, Authy…).</li>
        <li>Scan this code, or enter the key below.</li>
        <li>Type the 6-digit code it shows.</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enroll.qr} alt="QR code for your authenticator app" className="size-44 border border-line bg-white p-2" />
      <p className="break-all font-mono text-[13px]">Key: {enroll.secret}</p>
      <Field label="6-digit code" htmlFor="totp-code">
        <Input id="totp-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required className="max-w-[200px]" />
      </Field>
      <FormMessage state={state} />
      <div><SubmitButton variant="gold" pendingLabel="Checking…">Turn on two-factor</SubmitButton></div>
    </ActionForm>
  );
}

/** After staff finish 2FA setup, continue to where they were going (full load: the session level changed). */
export function ContinueTo({ href }: { href: string }) {
  useEffect(() => {
    window.location.assign(href);
  }, [href]);
  return (
    <p className="mb-8 border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
      Two-factor is on. <a href={href} className="font-semibold underline underline-offset-[3px]">Continue</a>
    </p>
  );
}

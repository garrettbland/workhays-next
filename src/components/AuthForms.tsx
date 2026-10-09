"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore } from "react";
import { forgotPassword, resetPassword, signIn, signUp, verifyMfa } from "@/app/(auth)/actions";
import { Field, Input } from "@/components/ui/Field";
import { FormMessage, SubmitButton } from "@/components/ui/Form";
import { Turnstile } from "@/components/Turnstile";

/** Reads ?next= (and ?claim=) from the address bar without making the page dynamic. */
function useNext(fallback = "/dashboard"): string {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const sp = new URLSearchParams(window.location.search);
      const claim = sp.get("claim");
      if (claim) return `/dashboard/new?claim=${encodeURIComponent(claim)}`;
      const next = sp.get("next") ?? "";
      return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
    },
    () => fallback,
  );
}

export function SignUpForm() {
  const next = useNext();
  const [state, action] = useActionState(signUp, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="first_name"><Input id="first_name" name="first_name" autoComplete="given-name" required /></Field>
        <Field label="Last name" htmlFor="last_name"><Input id="last_name" name="last_name" autoComplete="family-name" required /></Field>
      </div>
      <Field label="Work email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" htmlFor="password" hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Turnstile />
      <FormMessage state={state} />
      <SubmitButton variant="gold" pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-[14px] text-muted">
        By creating an account you agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
    </form>
  );
}

export function SignInForm() {
  const next = useNext();
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" htmlFor="password" hint={<Link href="/forgot-password" className="underline">Forgot your password?</Link>}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Turnstile />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function VerifyForm() {
  const next = useNext();
  const [state, action] = useActionState(verifyMfa, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field label="6-digit code" htmlFor="code">
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Checking…">Verify</SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Turnstile />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="New password" htmlFor="password" hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…">Save password</SubmitButton>
    </form>
  );
}

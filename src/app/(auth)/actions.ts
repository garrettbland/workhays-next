"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { SITE } from "@/lib/site";
import type { ActionState } from "@/components/ui/Form";

const signUpSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(80),
  last_name: z.string().trim().min(1, "Enter your last name").max(80),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(10, "Use at least 10 characters for your password").max(200),
  next: z.string().optional(),
});

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, first_name, last_name } = parsed.data;
  const next = safeNext(parsed.data.next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${SITE.url}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: { first_name, last_name },
      captchaToken: (form.get("cf-turnstile-response") as string) || undefined,
    },
  });
  if (error) return { error: friendly(error.message) };
  return { ok: `Almost done. We sent a confirmation link to ${email}. Open it to finish creating your account.` };
}

const signInSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const next = safeNext(parsed.data.next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { captchaToken: (form.get("cf-turnstile-response") as string) || undefined },
  });
  if (error) return { error: friendly(error.message) };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/sign-in/verify?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function verifyMfa(_: ActionState, form: FormData): Promise<ActionState> {
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const next = safeNext(form.get("next"));
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from your authenticator app." };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.find((f) => f.status === "verified");
  if (!factor) redirect(next);
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: "That code didn't work. Check your authenticator app and try again." };
  redirect(next);
}

export async function forgotPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${SITE.url}/auth/confirm?next=/reset-password`,
    captchaToken: (form.get("cf-turnstile-response") as string) || undefined,
  });
  // Same answer whether or not the account exists.
  return { ok: "If there's an account for that email, a reset link is on its way." };
}

export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters for your password." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "The passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendly(error.message) };
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Try again or reset your password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link we sent.";
  if (m.includes("already registered") || m.includes("already been registered")) return "There's already an account with that email. Try signing in.";
  if (m.includes("banned")) return "This account has been blocked. If you think that's a mistake, contact us through the contact page.";
  if (m.includes("captcha")) return "Please complete the verification check and try again.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("weak") || m.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

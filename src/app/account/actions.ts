"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser, safeNext } from "@/lib/auth";
import type { ActionState } from "@/components/ui/Form";

async function session() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/account");
  return { user, supabase: await createClient() };
}

export async function updateName(_: ActionState, form: FormData): Promise<ActionState> {
  const { user, supabase } = await session();
  const first = String(form.get("first_name") ?? "").trim().slice(0, 80);
  const last = String(form.get("last_name") ?? "").trim().slice(0, 80);
  if (!first) return { error: "Enter your first name." };
  const { error } = await supabase.from("profiles").update({ first_name: first, last_name: last || null }).eq("id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };
  return { ok: "Saved." };
}

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await session();
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "The passwords don't match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: "Password updated." };
}

export type TotpConfirmState = { error?: string; ok?: string; next?: string } | undefined;

export type EnrollState = { error?: string; factorId?: string; qr?: string; secret?: string } | undefined;

export async function startTotp(): Promise<EnrollState> {
  const { supabase } = await session();
  // Clear any half-finished setups first.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
  if (error || !data) return { error: "Couldn't start setup. Please try again." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmTotp(_: TotpConfirmState, form: FormData): Promise<TotpConfirmState> {
  const { supabase } = await session();
  const factorId = String(form.get("factor_id") ?? "");
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from your app." };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { error: "That code didn't work. Make sure your phone's clock is correct and try again." };
  const next = String(form.get("next") ?? "");
  // The session just changed (now aal2), so the client does a full page load to `next`.
  if (next) return { ok: "Two-factor authentication is on.", next: safeNext(next) };
  refresh();
  return { ok: "Two-factor authentication is on." };
}

export async function removeTotp(form: FormData): Promise<void> {
  const { supabase } = await session();
  await supabase.auth.mfa.unenroll({ factorId: String(form.get("factor_id") ?? "") });
  refresh();
}

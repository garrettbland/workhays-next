import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export type SessionUser = { id: string; email: string };

/** The signed-in user (verified JWT claims), or null. Request-time: call inside <Suspense> or an action. */
export async function getUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: String(claims.email ?? "") };
}

/**
 * For pages that need a signed-in user. Also enforces 2FA: anyone who has set up an
 * authenticator must complete the code step before using the dashboard.
 */
export async function requireUser(next: string): Promise<SessionUser> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect(`/sign-in?next=${encodeURIComponent(next)}`);

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/sign-in/verify?next=${encodeURIComponent(next)}`);
  }
  return { id: claims.sub, email: String(claims.email ?? "") };
}

/** Site staff (moderators/admins) must have 2FA turned on and verified for this session. */
export async function requireStaff(next: string): Promise<SessionUser & { role: "moderator" | "admin" }> {
  const user = await requireUser(next);
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("site_staff")
    .select("role")
    .eq("site_id", SITE.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff) redirect("/dashboard");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect(`/account?setup2fa=1&next=${encodeURIComponent(next)}`);
  return { ...user, role: staff.role as "moderator" | "admin" };
}

/** Only allow same-site relative redirects. */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { assertSiteAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { layout, sendEmail } from "@/lib/email";
import { refreshJobs } from "@/lib/refresh";
import { SITE } from "@/lib/site";

// User management is for site admins only. These actions use the service key (it can change
// any account), so every one starts with assertSiteAdmin(). Results come back as a banner via
// ?ok= / ?error= on the user page.

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const page = (userId: string, kind: "ok" | "error", message: string): never =>
  redirect(`/admin/users/${userId}?${kind}=${encodeURIComponent(message)}`);

type Db = ReturnType<typeof createAdminClient>;

async function audit(db: Db, actorId: string, userId: string, action: string, data: Record<string, unknown> = {}) {
  await db.from("audit_log").insert({ site_id: SITE.id, actor_id: actorId, action, entity_type: "user", entity_id: userId, data });
}

async function context(form: FormData) {
  const me = await assertSiteAdmin();
  const userId = str(form, "user_id");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid user");
  return { me, userId, db: createAdminClient() };
}

/** Name and email. An email change takes effect right away (no confirmation email). */
export async function updateUserDetails(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  const first = str(form, "first_name").slice(0, 80);
  const last = str(form, "last_name").slice(0, 80);
  const email = str(form, "email").toLowerCase();
  if (!z.email().safeParse(email).success) page(userId, "error", "Enter a valid email address.");

  const { data: before } = await db.from("profiles").select("email, first_name, last_name").eq("id", userId).single();
  if (!before) page(userId, "error", "User not found.");

  if (email !== before!.email) {
    const { error } = await db.auth.admin.updateUserById(userId, { email, email_confirm: true });
    if (error) page(userId, "error", error.message.includes("already") ? "Another account already uses that email." : error.message);
  }
  await db.auth.admin.updateUserById(userId, { user_metadata: { first_name: first, last_name: last } });
  await db.from("profiles").update({ first_name: first || null, last_name: last || null }).eq("id", userId);
  await audit(db, me.id, userId, "user.updated", { from: before, to: { email, first_name: first, last_name: last } });
  refresh();
  page(userId, "ok", "Saved.");
}

/** Staff role on this site: none, moderator or admin. */
export async function setStaffRole(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  const role = str(form, "role");
  if (!["none", "moderator", "admin"].includes(role)) page(userId, "error", "Choose a role.");
  if (userId === me.id && role !== "admin") page(userId, "error", "You can't remove your own admin access. Ask another admin.");
  if (role !== "admin") {
    const { data: admins } = await db.from("site_staff").select("user_id").eq("site_id", SITE.id).eq("role", "admin");
    if ((admins ?? []).length === 1 && admins![0].user_id === userId) page(userId, "error", "This is the only admin. Make someone else an admin first.");
  }
  if (role === "none") await db.from("site_staff").delete().eq("site_id", SITE.id).eq("user_id", userId);
  else await db.from("site_staff").upsert({ site_id: SITE.id, user_id: userId, role });
  await audit(db, me.id, userId, "user.staff_role", { role });
  refresh();
  page(userId, "ok", role === "none" ? "Removed from staff." : `Now a site ${role}. They'll be asked to set up two-factor sign-in.`);
}

/**
 * Change someone's role on a business, or remove them. Making someone the owner moves the
 * current owner to admin (a business always has exactly one owner).
 */
export async function setMembership(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  const employerId = str(form, "employer_id");
  const role = str(form, "role");
  const back = str(form, "back") || `/admin/users/${userId}`;
  const done = (kind: "ok" | "error", msg: string): never => redirect(`${back}${back.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);

  const { data: current } = await db.from("employer_members").select("role").eq("employer_id", employerId).eq("user_id", userId).maybeSingle();
  if (role === "remove") {
    if (current?.role === "owner") done("error", "Make someone else the owner before removing the current owner.");
    await db.from("employer_members").delete().eq("employer_id", employerId).eq("user_id", userId);
  } else if (["owner", "admin", "member"].includes(role)) {
    if (current?.role === "owner" && role !== "owner") done("error", "To change the owner, make someone else the owner.");
    if (role === "owner") await db.from("employer_members").update({ role: "admin" }).eq("employer_id", employerId).eq("role", "owner");
    await db.from("employer_members").upsert({ employer_id: employerId, user_id: userId, role, added_by: current ? undefined : me.id });
  } else {
    done("error", "Choose a role.");
  }
  await audit(db, me.id, userId, "user.membership", { employer_id: employerId, role });
  refreshJobs({ employerId });
  refresh();
  done("ok", role === "remove" ? "Removed from the business." : `Role set to ${role}.`);
}

/** From an employer's admin page: add an existing account to the team by email. */
export async function addTeamMember(form: FormData): Promise<void> {
  const me = await assertSiteAdmin();
  const db = createAdminClient();
  const employerId = str(form, "employer_id");
  const email = str(form, "email").toLowerCase();
  const role = str(form, "role");
  const back = (kind: "ok" | "error", msg: string): never => redirect(`/admin/employers/${employerId}?${kind}=${encodeURIComponent(msg)}`);
  if (!["owner", "admin", "member"].includes(role)) back("error", "Choose a role.");
  const { data: user } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!user) back("error", `No account uses ${email}. Ask them to sign up first, or send a team invite from the business's dashboard.`);
  if (role === "owner") await db.from("employer_members").update({ role: "admin" }).eq("employer_id", employerId).eq("role", "owner");
  const { error } = await db.from("employer_members").upsert({ employer_id: employerId, user_id: user!.id, role, added_by: me.id });
  if (error) back("error", error.message);
  await audit(db, me.id, user!.id, "user.membership", { employer_id: employerId, role, added: true });
  refreshJobs({ employerId });
  refresh();
  back("ok", `${email} added as ${role}.`);
}

/** Emails a password-reset link (works even though sign-in forms require the bot check). */
export async function sendPasswordReset(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  const { data: profile } = await db.from("profiles").select("email, first_name").eq("id", userId).single();
  if (!profile) page(userId, "error", "User not found.");
  const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email: profile!.email });
  if (error || !data.properties?.hashed_token) page(userId, "error", error?.message ?? "Couldn't create a reset link.");
  const link = `${SITE.url}/auth/confirm?token_hash=${data.properties!.hashed_token}&type=recovery&next=/reset-password`;
  const { html, text } = layout({
    heading: "Reset your Work Hays password",
    paragraphs: [`Hi${profile!.first_name ? ` ${profile!.first_name}` : ""}, a ${SITE.name} admin sent you this link to set a new password.`, "The link works once and expires in an hour. If you didn't ask for this, you can ignore it."],
    button: { label: "Set a new password", url: link },
  });
  await sendEmail({ to: profile!.email, subject: `Reset your ${SITE.name} password`, html, text });
  await audit(db, me.id, userId, "user.password_reset_sent");
  page(userId, "ok", `Password reset link sent to ${profile!.email}.`);
}

/** Removes their authenticator app so they can sign in with just a password (and set it up again). */
export async function resetTwoFactor(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  const { data, error } = await db.auth.admin.mfa.listFactors({ userId });
  if (error) page(userId, "error", error.message);
  for (const f of data?.factors ?? []) await db.auth.admin.mfa.deleteFactor({ id: f.id, userId });
  await audit(db, me.id, userId, "user.2fa_reset", { removed: data?.factors?.length ?? 0 });
  page(userId, "ok", data?.factors?.length ? "Two-factor sign-in removed. They can set it up again from their account page." : "They didn't have two-factor sign-in set up.");
}

/** Blocks sign-in (or lifts the block). Their business and jobs are not changed. */
export async function setBlocked(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  const block = form.get("block") === "1";
  if (block && userId === me.id) page(userId, "error", "You can't block yourself.");
  const { error } = await db.auth.admin.updateUserById(userId, { ban_duration: block ? "876000h" : "none" });
  if (error) page(userId, "error", error.message);
  await audit(db, me.id, userId, block ? "user.blocked" : "user.unblocked");
  page(userId, "ok", block ? "Blocked. They can't sign in (anyone already signed in is logged out within an hour)." : "Unblocked. They can sign in again.");
}

/** Deletes the account for good. Not allowed while they own a business. */
export async function deleteUser(form: FormData): Promise<void> {
  const { me, userId, db } = await context(form);
  if (userId === me.id) page(userId, "error", "You can't delete your own account here.");
  const { data: profile } = await db.from("profiles").select("email").eq("id", userId).single();
  if (!profile) page(userId, "error", "User not found.");
  if (str(form, "confirm").toLowerCase() !== profile!.email) page(userId, "error", "Type their email address exactly to confirm.");
  const { count } = await db.from("employer_members").select("employer_id", { count: "exact", head: true }).eq("user_id", userId).eq("role", "owner");
  if (count) page(userId, "error", "They own a business. Make someone else the owner (or remove the business) first.");
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) page(userId, "error", error.message);
  await db.from("audit_log").insert({ site_id: SITE.id, actor_id: me.id, action: "user.deleted", entity_type: "user", entity_id: userId, data: { email: profile!.email } });
  refreshJobs();
  redirect(`/admin/users?ok=${encodeURIComponent(`Deleted ${profile!.email}.`)}`);
}

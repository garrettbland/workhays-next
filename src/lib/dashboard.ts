import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, type SessionUser } from "@/lib/auth";

export type MemberRole = "owner" | "admin" | "member";
export type EmployerRow = {
  id: string;
  site_id: string;
  name: string;
  status: "pending" | "approved" | "denied" | "suspended";
  status_reason: string | null;
  description_html: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  logo_path: string | null;
};

/** Loads a business the signed-in user belongs to (404 otherwise) plus their role in it. */
export async function getMyEmployer(employerId: string, next: string): Promise<{
  user: SessionUser;
  employer: EmployerRow;
  role: MemberRole;
  canManage: boolean;
}> {
  const user = await requireUser(next);
  const supabase = await createClient();
  const [{ data: employer }, { data: member }] = await Promise.all([
    supabase.from("employers").select("*").eq("id", employerId).maybeSingle(),
    supabase.from("employer_members").select("role").eq("employer_id", employerId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (!employer || !member) notFound();
  const role = member.role as MemberRole;
  return { user, employer: employer as EmployerRow, role, canManage: role === "owner" || role === "admin" };
}

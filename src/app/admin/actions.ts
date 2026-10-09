"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { notifyEmployerReviewed } from "@/lib/notify";

async function session() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/admin");
  return createClient();
}

export async function reviewEmployer(form: FormData): Promise<void> {
  const supabase = await session();
  const employerId = String(form.get("employer_id"));
  const approve = form.get("approve") === "1";
  const reason = String(form.get("reason") ?? "").trim() || null;
  const { error } = await supabase.rpc("review_employer", { p_employer_id: employerId, p_approve: approve, p_reason: reason });
  if (!error) {
    const { data } = await supabase.from("employers").select("name").eq("id", employerId).single();
    await notifyEmployerReviewed({ employerId, name: data?.name ?? "Your business", approved: approve, reason });
    updateTag("employers");
    updateTag("jobs");
  }
  refresh();
}

export async function reviewClaim(form: FormData): Promise<void> {
  const supabase = await session();
  await supabase.rpc("review_employer_claim", { p_claim_id: String(form.get("claim_id")), p_approve: form.get("approve") === "1" });
  updateTag("employers");
  refresh();
}

export async function reviewEvent(form: FormData): Promise<void> {
  const supabase = await session();
  await supabase.rpc("review_event", { p_event_id: String(form.get("event_id")), p_approve: form.get("approve") === "1", p_note: null });
  updateTag("events");
  refresh();
}

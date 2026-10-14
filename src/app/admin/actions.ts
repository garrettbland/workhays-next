"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { notifyEmployerReviewed, notifyEventReviewed } from "@/lib/notify";

// Every write below is also checked in the database (RLS / staff-only RPCs), so a
// signed-in non-staff user calling these gets an error, not a change.
async function session() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/admin");
  return createClient();
}

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const back = (form: FormData) => {
  const to = str(form, "back");
  if (to.startsWith("/admin")) redirect(to);
};

export async function reviewEmployer(form: FormData): Promise<void> {
  const supabase = await session();
  const employerId = str(form, "employer_id");
  const approve = form.get("approve") === "1";
  const reason = str(form, "reason") || null;
  const { error } = await supabase.rpc("review_employer", { p_employer_id: employerId, p_approve: approve, p_reason: reason });
  if (error) throw new Error(error.message);
  const { data } = await supabase.from("employers").select("name").eq("id", employerId).single();
  await notifyEmployerReviewed({ employerId, name: data?.name ?? "Your business", approved: approve, reason });
  updateTag("employers");
  updateTag("jobs");
  back(form);
  refresh();
}

/** Approve, suspend or deny an existing business (suspending hides it and its jobs right away). */
export async function setEmployerStatus(form: FormData): Promise<void> {
  const supabase = await session();
  const status = str(form, "status");
  if (!["approved", "suspended", "denied", "pending"].includes(status)) throw new Error("Invalid status");
  const { error } = await supabase.rpc("set_employer_status", {
    p_employer_id: str(form, "employer_id"),
    p_status: status,
    p_reason: str(form, "reason") || null,
  });
  if (error) throw new Error(error.message);
  updateTag("employers");
  updateTag("jobs");
  refresh();
}

export async function reviewEvent(form: FormData): Promise<void> {
  const supabase = await session();
  const eventId = str(form, "event_id");
  const approve = form.get("approve") === "1";
  const note = str(form, "note") || null;
  const { error } = await supabase.rpc("review_event", { p_event_id: eventId, p_approve: approve, p_note: note });
  if (error) throw new Error(error.message);
  const { data: ev } = await supabase.from("events").select("title, submitter_email").eq("id", eventId).single();
  if (ev?.submitter_email) {
    await notifyEventReviewed({ eventId, title: ev.title, email: ev.submitter_email, approved: approve, note });
  }
  updateTag("events");
  updateTag(`event:${eventId}`);
  back(form);
  refresh();
}

/** Takes an event down (kept in the database, hidden everywhere). */
export async function removeEvent(form: FormData): Promise<void> {
  const supabase = await session();
  const eventId = str(form, "event_id");
  const { error } = await supabase.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", eventId);
  if (error) throw new Error(error.message);
  updateTag("events");
  updateTag(`event:${eventId}`);
  back(form);
  refresh();
}

/** Takes a job down: "filled" if the business asked, "archived" for policy removals. */
export async function closeJobAsStaff(form: FormData): Promise<void> {
  const supabase = await session();
  const status = form.get("status") === "filled" ? "filled" : "archived";
  const { error } = await supabase.rpc("close_job", { p_job_id: str(form, "job_id"), p_status: status });
  if (error) throw new Error(error.message);
  updateTag("jobs");
  refresh();
}

export async function setMessageStatus(form: FormData): Promise<void> {
  const supabase = await session();
  const status = str(form, "status");
  if (!["new", "handled", "spam"].includes(status)) throw new Error("Invalid status");
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", str(form, "message_id"));
  if (error) throw new Error(error.message);
  refresh();
}

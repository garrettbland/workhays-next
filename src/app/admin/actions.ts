"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { refreshEvents, refreshJobs } from "@/lib/refresh";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { notifyEmployerReviewed, notifyEmployerStatusByStaff, notifyEventReviewed, notifyJobChangedByStaff } from "@/lib/notify";
import { parseJobFields } from "@/lib/job-fields";
import { sendConversationReply, type Conversation } from "@/lib/inbox";
import { zonedIso } from "@/lib/events";
import type { ActionState } from "@/components/ui/Form";

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
  refreshJobs({ employerId });
  back(form);
  refresh();
}

/** Approve, suspend or deny an existing business (suspending hides it and its jobs right away). */
export async function setEmployerStatus(form: FormData): Promise<void> {
  const supabase = await session();
  const status = str(form, "status");
  if (!["approved", "suspended", "denied", "pending"].includes(status)) throw new Error("Invalid status");
  const employerId = str(form, "employer_id");
  const message = str(form, "reason") || null;
  const { error } = await supabase.rpc("set_employer_status", { p_employer_id: employerId, p_status: status, p_reason: message });
  if (error) throw new Error(error.message);
  if (form.get("notify") === "on" && (status === "suspended" || status === "approved")) {
    const { data } = await supabase.from("employers").select("name").eq("id", employerId).single();
    const me = await getUser();
    await notifyEmployerStatusByStaff({ employerId, name: data?.name ?? "Your business", status, message, replyTo: me?.email });
  }
  refreshJobs({ employerId });
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
  refreshEvents(eventId);
  back(form);
  refresh();
}

/** Takes an event down (kept in the database, hidden everywhere). */
export async function removeEvent(form: FormData): Promise<void> {
  const supabase = await session();
  const eventId = str(form, "event_id");
  const { error } = await supabase.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", eventId);
  if (error) throw new Error(error.message);
  refreshEvents(eventId);
  back(form);
  refresh();
}

async function jobForNotice(supabase: Awaited<ReturnType<typeof createClient>>, jobId: string) {
  const { data } = await supabase.from("jobs").select("id, title, employer_id, created_by, status").eq("id", jobId).single();
  return data;
}

/** Takes a job off the site ("archived"). Optionally emails the business, with an optional note. */
export async function takeDownJob(form: FormData): Promise<void> {
  const supabase = await session();
  const jobId = str(form, "job_id");
  const { error } = await supabase.rpc("close_job", { p_job_id: jobId, p_status: "archived" });
  if (error) throw new Error(error.message);
  const job = await jobForNotice(supabase, jobId);
  if (job && form.get("notify") === "on") {
    const me = await getUser();
    await notifyJobChangedByStaff({
      jobId, title: job.title, employerId: job.employer_id, createdBy: job.created_by,
      change: "taken_down", message: str(form, "message") || null, replyTo: me?.email,
    });
  }
  refreshJobs({ jobId, employerId: job?.employer_id });
  refresh();
}

/** Puts a job back up. If its old expiry has passed, it gets a fresh posting period. */
export async function restoreJob(form: FormData): Promise<void> {
  const supabase = await session();
  const jobId = str(form, "job_id");
  const { error } = await supabase.from("jobs").update({ status: "active" }).eq("id", jobId);
  if (error) throw new Error(error.message);
  const job = await jobForNotice(supabase, jobId);
  if (job && form.get("notify") === "on") {
    const me = await getUser();
    await notifyJobChangedByStaff({
      jobId, title: job.title, employerId: job.employer_id, createdBy: job.created_by,
      change: "restored", message: str(form, "message") || null, replyTo: me?.email,
    });
  }
  refreshJobs({ jobId, employerId: job?.employer_id });
  refresh();
}

/** Staff can set a job's expiry date directly (end of that day, Central time). */
export async function setJobExpiry(form: FormData): Promise<void> {
  const supabase = await session();
  const jobId = str(form, "job_id");
  const date = str(form, "expires_on");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a date");
  const { error } = await supabase
    .from("jobs")
    .update({ expires_at: zonedIso(date, "23:59"), expiry_reminder_sent_at: null })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
  refreshJobs({ jobId });
  refresh();
}

/** Staff edits to a job's content. Status is changed with the take down / put back up actions. */
export async function adminSaveJob(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await session();
  const jobId = str(form, "job_id");
  const parsed = parseJobFields(form);
  if ("error" in parsed) return { error: parsed.error };
  const { data, error } = await supabase.from("jobs").update(parsed.fields).eq("id", jobId).select("id, employer_id");
  if (error) return { error: "Couldn't save the job. Please try again." };
  if (!data?.length) return { error: "Job not found." };
  refreshJobs({ jobId, employerId: data[0].employer_id });
  redirect(`/admin/jobs/${jobId}?saved=1`);
}

export async function setMessageStatus(form: FormData): Promise<void> {
  const supabase = await session();
  const status = str(form, "status");
  if (!["new", "handled", "spam"].includes(status)) throw new Error("Invalid status");
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", str(form, "message_id"));
  if (error) throw new Error(error.message);
  refresh();
}

/** Reply to a contact message from the admin. The email goes from the site, with the conversation's reply address. */
export async function replyToMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await session();
  const me = await getUser();
  if (!me) return { error: "Please sign in again." };
  const body = str(form, "body");
  if (body.length < 2) return { error: "Write a reply first." };
  if (body.length > 10_000) return { error: "That reply is too long." };
  const { data: convo } = await supabase
    .from("contact_messages")
    .select("id, site_id, name, email, message, created_at, reply_token")
    .eq("id", str(form, "message_id"))
    .maybeSingle();
  if (!convo) return { error: "Message not found." };
  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", me.id).single();
  const result = await sendConversationReply(supabase, convo as Conversation, { id: me.id, firstName: profile?.first_name ?? null }, body);
  if ("error" in result) return result;
  refresh();
  return { ok: `Reply sent to ${convo.email}.` };
}

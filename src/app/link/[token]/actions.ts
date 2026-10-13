"use server";

import { updateTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type LinkState = { ok?: string; error?: string } | undefined;

const DONE: Record<string, (r: { expires_at?: string }) => string> = {
  job_renew: () => "Done. Your job is renewed for 30 days and back at the top of the list.",
  job_close: () => "Done. The job is marked filled and has been taken down. Congratulations on the hire!",
  job_confirm_auto_renew: () => "Thanks! The job will keep renewing automatically.",
  subscriber_confirm: () => "You're subscribed. Look for new jobs in your inbox every Monday.",
  subscriber_unsubscribe: () => "You've been unsubscribed. You won't get any more job emails.",
};

/** Runs only on the button POST, never on page load: email scanners open links but don't press buttons. */
export async function performLink(_: LinkState, form: FormData): Promise<LinkState> {
  const token = String(form.get("token") ?? "");
  const { data, error } = await createPublicClient().rpc("use_action_token", { p_token: token });
  if (error) return { error: error.message };
  const r = data as { purpose: string; job_id?: string; expires_at?: string };
  if (r.job_id) {
    updateTag("jobs");
    updateTag(`job:${r.job_id}`);
  }
  return { ok: DONE[r.purpose]?.(r) ?? "Done." };
}

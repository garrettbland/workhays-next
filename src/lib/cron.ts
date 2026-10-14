import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { layout, sendBatch, sendEmail, type Email } from "@/lib/email";
import { formatLongDate, formatShortDate, JOB_TYPE_LABELS } from "@/lib/format";
import { SITE } from "@/lib/site";

type DueJob = { id: string; employer_id: string; title: string; expires_at: string; created_by: string | null };

/**
 * The daily run (called by Vercel Cron). Each step is independent and safe to re-run:
 * every email marks what it sent, so a retry never double-sends.
 */
export async function runDaily(now = new Date()) {
  const db = createAdminClient();
  const result: Record<string, unknown> = {};

  const { data: maintenance, error } = await db.rpc("run_job_maintenance");
  if (error) throw new Error(`maintenance failed: ${error.message}`);
  result.maintenance = maintenance;

  result.expiryReminders = await sendExpiryReminders(db);
  result.stillHiringChecks = await sendStillHiringChecks(db);
  result.adminDigest = await sendAdminDigest(db, now);
  result.weeklyDigest = await sendWeeklyDigest(db, now);
  return result;
}

/** Who hears about a business's jobs: its owners and admins, plus whoever posted each job. */
async function contactsFor(db: SupabaseClient, employerIds: string[]) {
  const { data: members } = await db
    .from("employer_members")
    .select("employer_id, user_id, role, profile:profiles!employer_members_user_id_fkey(email), employer:employers(name)")
    .in("employer_id", employerIds);
  type Row = { employer_id: string; user_id: string; role: string; profile: { email: string } | null; employer: { name: string } | null };
  const byEmployer = new Map<string, { name: string; managers: string[]; emailById: Map<string, string> }>();
  for (const m of (members ?? []) as unknown as Row[]) {
    const entry = byEmployer.get(m.employer_id) ?? { name: m.employer?.name ?? "your business", managers: [] as string[], emailById: new Map<string, string>() };
    if (m.profile?.email) {
      entry.emailById.set(m.user_id, m.profile.email);
      if (m.role === "owner" || m.role === "admin") entry.managers.push(m.profile.email);
    }
    byEmployer.set(m.employer_id, entry);
  }
  return byEmployer;
}

async function token(db: SupabaseClient, purpose: string, targetId: string, ttl = "7 days"): Promise<string> {
  const { data, error } = await db.rpc("create_action_token", { p_purpose: purpose, p_target_id: targetId, p_ttl: ttl });
  if (error) throw new Error(`token failed: ${error.message}`);
  return `${SITE.url}/link/${data as string}`;
}

function groupByEmployer(jobs: DueJob[]) {
  const map = new Map<string, DueJob[]>();
  for (const j of jobs) map.set(j.employer_id, [...(map.get(j.employer_id) ?? []), j]);
  return map;
}

/** One email per business listing every job that expires in the next few days, with no-login Renew / Filled links. */
async function sendExpiryReminders(db: SupabaseClient) {
  const { data, error } = await db.rpc("jobs_due_for_expiry_reminder", { p_site_id: SITE.id });
  if (error) throw new Error(`expiry query failed: ${error.message}`);
  const jobs = (data ?? []) as DueJob[];
  if (!jobs.length) return { emails: 0, jobs: 0 };

  const grouped = groupByEmployer(jobs);
  const contacts = await contactsFor(db, [...grouped.keys()]);
  let emails = 0;

  for (const [employerId, list] of grouped) {
    const c = contacts.get(employerId);
    const to = new Set(c?.managers ?? []);
    for (const j of list) if (j.created_by && c?.emailById.get(j.created_by)) to.add(c.emailById.get(j.created_by)!);
    if (to.size) {
      const items = [];
      for (const j of list) {
        items.push({
          title: j.title,
          detail: `Expires ${formatLongDate(j.expires_at)}`,
          links: [
            { label: "Renew for 30 days", url: await token(db, "job_renew", j.id) },
            { label: "Position filled", url: await token(db, "job_close", j.id) },
          ],
        });
      }
      const n = list.length;
      const { html, text } = layout({
        heading: n === 1 ? `Your job “${list[0].title}” expires soon` : `${n} of your jobs expire soon`,
        paragraphs: [`Still hiring? Renew with one click. No need to sign in. Renewing moves the job back to the top of ${SITE.name}.`],
        items,
        after: ["Tired of renewing? Turn on auto-renew for a job in your dashboard and we'll keep it up for you."],
        button: { label: "Open your dashboard", url: `${SITE.url}/dashboard/${employerId}` },
      });
      await sendEmail({
        to: [...to],
        subject: n === 1 ? `Expiring soon: ${list[0].title}` : `${n} jobs expiring soon at ${c?.name}`,
        html,
        text,
      });
      emails++;
    }
    await db.from("jobs").update({ expiry_reminder_sent_at: new Date().toISOString() }).in("id", list.map((j) => j.id));
  }
  return { emails, jobs: jobs.length };
}

/** Auto-renewing jobs get a "still hiring?" check every 60 days; unanswered for 7 days, auto-renew turns off. */
async function sendStillHiringChecks(db: SupabaseClient) {
  const { data, error } = await db.rpc("jobs_due_for_auto_renew_check", { p_site_id: SITE.id });
  if (error) throw new Error(`auto-renew query failed: ${error.message}`);
  const jobs = (data ?? []) as DueJob[];
  if (!jobs.length) return { emails: 0, jobs: 0 };

  const grouped = groupByEmployer(jobs);
  const contacts = await contactsFor(db, [...grouped.keys()]);
  let emails = 0;
  for (const [employerId, list] of grouped) {
    const c = contacts.get(employerId);
    const to = new Set(c?.managers ?? []);
    for (const j of list) if (j.created_by && c?.emailById.get(j.created_by)) to.add(c.emailById.get(j.created_by)!);
    if (to.size) {
      const items = [];
      for (const j of list) {
        items.push({
          title: j.title,
          links: [
            { label: "Yes, still hiring", url: await token(db, "job_confirm_auto_renew", j.id, "14 days") },
            { label: "No, it's filled", url: await token(db, "job_close", j.id, "14 days") },
          ],
        });
      }
      const { html, text } = layout({
        heading: list.length === 1 ? `Still hiring for ${list[0].title}?` : `Still hiring for these ${list.length} jobs?`,
        paragraphs: [
          "These jobs renew automatically. To keep listings current, we check in every couple of months.",
          "If we don't hear back within 7 days, auto-renew turns off and the job expires normally.",
        ],
        items,
      });
      await sendEmail({ to: [...to], subject: `Still hiring? Quick check from ${SITE.name}`, html, text });
      emails++;
    }
    await db.from("jobs").update({ auto_renew_check_sent_at: new Date().toISOString() }).in("id", list.map((j) => j.id));
  }
  return { emails, jobs: jobs.length };
}

/** Daily nudge to moderators when anything has been waiting more than a day. */
async function sendAdminDigest(db: SupabaseClient, now: Date) {
  const cutoff = new Date(now.getTime() - 24 * 3600_000).toISOString();
  const [emp, events, staff] = await Promise.all([
    db.from("employers").select("id", { count: "exact", head: true }).eq("site_id", SITE.id).eq("status", "pending").lt("created_at", cutoff),
    db.from("events").select("id", { count: "exact", head: true }).eq("site_id", SITE.id).eq("status", "pending").lt("created_at", cutoff),
    db.from("site_staff").select("profiles(email)").eq("site_id", SITE.id),
  ]);
  const counts = { businesses: emp.count ?? 0, events: events.count ?? 0 };
  const total = counts.businesses + counts.events;
  if (!total) return { sent: false, ...counts };

  const to = (staff.data ?? []).map((r) => (r.profiles as unknown as { email: string } | null)?.email).filter((e): e is string => !!e);
  const lines = [
    counts.businesses && `${counts.businesses} new ${counts.businesses === 1 ? "business" : "businesses"}`,
    counts.events && `${counts.events} submitted ${counts.events === 1 ? "event" : "events"}`,
  ].filter(Boolean) as string[];
  const { html, text } = layout({
    heading: `${total} ${total === 1 ? "item is" : "items are"} waiting for review`,
    paragraphs: [`Waiting more than a day: ${lines.join(", ")}.`, "Local employers can't post until they're approved."],
    button: { label: "Open the review queue", url: `${SITE.url}/admin` },
  });
  await sendEmail({ to, subject: `[${SITE.name}] ${total} waiting for review`, html, text });
  return { sent: true, ...counts };
}

/** Monday mornings: new jobs from the past week to confirmed subscribers. Skips if already sent this week. */
async function sendWeeklyDigest(db: SupabaseClient, now: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: SITE.timezone }).format(now);
  if (weekday !== "Mon") return { sent: 0, reason: "not Monday" };

  const sixDaysAgo = new Date(now.getTime() - 6 * 86400_000).toISOString();
  const { count: already } = await db
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("site_id", SITE.id)
    .eq("action", "digest.sent")
    .gt("created_at", sixDaysAgo);
  if (already) return { sent: 0, reason: "already sent this week" };

  const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const { data: jobs } = await db
    .from("job_listings")
    .select("id, title, employer_name, job_type, published_at")
    .eq("site_id", SITE.id)
    .gt("published_at", weekAgo)
    .order("published_at", { ascending: false })
    .limit(40);
  if (!jobs?.length) return { sent: 0, reason: "no new jobs" };

  const { data: subs } = await db.from("subscribers").select("id, email").eq("site_id", SITE.id).eq("status", "confirmed");
  if (!subs?.length) return { sent: 0, reason: "no subscribers" };

  const items = jobs.map((j) => ({
    title: j.title,
    detail: `${j.employer_name} · ${JOB_TYPE_LABELS[j.job_type] ?? j.job_type} · ${formatShortDate(j.published_at)}`,
    url: `${SITE.url}/jobs/${j.id}`,
  }));
  const emails: Email[] = [];
  for (const s of subs) {
    const unsubscribeUrl = await token(db, "subscriber_unsubscribe", s.id);
    const oneClick = `${SITE.url}/api/unsubscribe?token=${unsubscribeUrl.split("/link/")[1]}`;
    const { html, text } = layout({
      heading: `${jobs.length} new ${jobs.length === 1 ? "job" : "jobs"} this week`,
      paragraphs: ["Here's what was posted in Hays and western Kansas over the last 7 days."],
      items,
      button: { label: "See all jobs", url: SITE.url },
      unsubscribeUrl,
    });
    emails.push({
      to: s.email,
      subject: `${jobs.length} new ${jobs.length === 1 ? "job" : "jobs"} in Hays this week`,
      html,
      text,
      headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
  }
  const res = await sendBatch(emails);
  await db.from("audit_log").insert({ site_id: SITE.id, action: "digest.sent", entity_type: "site", data: { jobs: jobs.length, ...res } });
  return res;
}

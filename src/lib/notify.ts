import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { layout, sendEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

/** Emails of this site's moderators and admins. */
async function staffEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_staff").select("profiles(email)").eq("site_id", SITE.id);
  return (data ?? []).map((r) => (r.profiles as unknown as { email: string } | null)?.email).filter((e): e is string => !!e);
}

async function ownerEmails(employerId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("employer_members")
    .select("role, profiles!employer_members_user_id_fkey(email)")
    .eq("employer_id", employerId)
    .in("role", ["owner", "admin"]);
  return (data ?? []).map((r) => (r.profiles as unknown as { email: string } | null)?.email).filter((e): e is string => !!e);
}

export async function notifyNewEmployer(opts: { employerId: string; name: string; submittedBy: string }) {
  const { html, text } = layout({
    heading: `New business waiting for approval: ${opts.name}`,
    paragraphs: [`${opts.submittedBy} signed up "${opts.name}" on ${SITE.name}.`, "Review it to let them start posting jobs."],
    button: { label: "Review in admin", url: `${SITE.url}/admin/employers/${opts.employerId}` },
  });
  await sendEmail({ to: await staffEmails(), subject: `[${SITE.name}] New business to review: ${opts.name}`, html, text });
}

export async function notifyNewEvent(opts: { eventId: string; title: string; when: string; where: string; description: string; submittedBy: string }) {
  const { html, text } = layout({
    heading: `New event to review: ${opts.title}`,
    paragraphs: [`${opts.when} · ${opts.where}`, opts.description.slice(0, 600), `Submitted by ${opts.submittedBy}.`],
    button: { label: "Review the event", url: `${SITE.url}/admin/events/${opts.eventId}` },
  });
  await sendEmail({ to: await staffEmails(), subject: `[${SITE.name}] Event to review: ${opts.title}`, html, text });
}

/** Heads-up when an approved business posts an event (it's already live; no review needed). */
export async function notifyEventPosted(opts: {
  eventId: string; title: string; when: string; where: string; description: string; business: string; postedBy: string;
}) {
  const { html, text } = layout({
    heading: `${opts.business} posted an event: ${opts.title}`,
    paragraphs: [
      `${opts.when} · ${opts.where}`,
      opts.description.slice(0, 600),
      `Posted by ${opts.postedBy}. It's live now. No review needed; you can take it down from the admin page if something's wrong.`,
    ],
    button: { label: "View in admin", url: `${SITE.url}/admin/events/${opts.eventId}` },
  });
  await sendEmail({ to: await staffEmails(), subject: `[${SITE.name}] New event from ${opts.business}: ${opts.title}`, html, text });
}

/** Tells the person who submitted a public event whether it was posted. */
export async function notifyEventReviewed(opts: { eventId: string; title: string; email: string; approved: boolean; note?: string | null }) {
  const { html, text } = opts.approved
    ? layout({
        heading: `Your event is posted: ${opts.title}`,
        paragraphs: ["Thanks for sharing it. Here's the link if you'd like to pass it around."],
        button: { label: "View your event", url: `${SITE.url}/events/${opts.eventId}` },
      })
    : layout({
        heading: `We didn't post ${opts.title}`,
        paragraphs: [
          opts.note ? `Note from our moderator: ${opts.note}` : "It didn't fit what we list on the events page.",
          "Questions? Reply to this email.",
        ],
      });
  await sendEmail({
    to: opts.email,
    subject: opts.approved ? `Your event is live on ${SITE.name}` : `About the event you submitted to ${SITE.name}`,
    html,
    text,
  });
}

export async function notifyEmployerReviewed(opts: { employerId: string; name: string; approved: boolean; reason?: string | null }) {
  const { html, text } = opts.approved
    ? layout({
        heading: `${opts.name} is approved`,
        paragraphs: ["Your business is live on Work Hays. You can publish jobs and events now."],
        button: { label: "Go to your dashboard", url: `${SITE.url}/dashboard/${opts.employerId}` },
      })
    : layout({
        heading: `We couldn't approve ${opts.name}`,
        paragraphs: [
          opts.reason ? `Reason: ${opts.reason}` : "We weren't able to verify this business.",
          "If you think this is a mistake, reply to this email.",
        ],
      });
  await sendEmail({
    to: await ownerEmails(opts.employerId),
    subject: opts.approved ? `${opts.name} is approved on ${SITE.name}` : `About your ${SITE.name} business listing`,
    html,
    text,
  });
}

export async function sendTeamInvite(opts: { email: string; employerName: string; invitedBy: string; role: string; token: string }) {
  const { html, text } = layout({
    heading: `Join ${opts.employerName} on ${SITE.name}`,
    paragraphs: [
      `${opts.invitedBy} invited you to help manage job listings for ${opts.employerName} as ${opts.role === "admin" ? "an admin" : "a team member"}.`,
      "The invite expires in 7 days.",
    ],
    button: { label: "View invite", url: `${SITE.url}/invite/${opts.token}` },
  });
  await sendEmail({ to: opts.email, subject: `${opts.invitedBy} invited you to ${opts.employerName} on ${SITE.name}`, html, text });
}

import { createClient } from "@/lib/supabase/server";
import { getAttachmentUrl } from "@/lib/inbox";

/** Staff download of a received attachment: looks up a fresh, short-lived link from Resend. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const entryId = url.searchParams.get("entry") ?? "";
  const attachmentId = url.searchParams.get("att") ?? "";
  const supabase = await createClient();
  // Row-level security: only staff can read conversation entries.
  const { data: entry } = await supabase.from("contact_message_entries").select("email_id, attachments").eq("id", entryId).maybeSingle();
  const known = ((entry?.attachments ?? []) as { id: string }[]).some((a) => a.id === attachmentId);
  if (!entry?.email_id || !known) return new Response("Not found", { status: 404 });
  const link = await getAttachmentUrl(entry.email_id, attachmentId);
  if (!link) return new Response("This attachment is no longer available.", { status: 410 });
  return Response.redirect(link, 302);
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/data";
import { inboundDomain } from "@/lib/inbox";
import { SITE } from "@/lib/site";
import { setMessageStatus } from "@/app/admin/actions";
import { ReplyForm } from "@/components/admin/ReplyForm";
import { Loading } from "@/components/ui/Page";
import { StatusBadge } from "@/components/admin/List";

export const metadata: Metadata = { title: "Message · Admin", robots: { index: false } };

export default function AdminMessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  return (
    <>
      <Link href="/admin/messages" className="font-mono text-[13px] text-muted">← All messages</Link>
      <Suspense fallback={<Loading />}>
        <Conversation params={params} />
      </Suspense>
    </>
  );
}

const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: SITE.timezone });

type Entry = {
  id: string;
  direction: "in" | "out";
  from_email: string;
  from_name: string | null;
  body_text: string;
  created_at: string;
  attachments: { id: string; filename: string; size: number | null }[];
  staff: { first_name: string | null; last_name: string | null; email: string } | null;
};

async function Conversation({ params }: Pick<PageProps<"/admin/messages/[id]">, "params">) {
  const { id } = await params;
  await requireStaff(`/admin/messages/${id}`);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data: m, error }, { data: entries }] = await Promise.all([
    supabase.from("contact_messages").select("id, name, email, phone, message, status, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("contact_message_entries")
      .select("id, direction, from_email, from_name, body_text, created_at, attachments, staff:profiles(first_name, last_name, email)")
      .eq("message_id", id)
      .order("created_at"),
  ]);
  if (error) throw new Error(error.message);
  if (!m) notFound();

  const timeline = [
    { id: "original", direction: "in" as const, who: m.name, sub: "Contact form", body: m.message, at: m.created_at, attachments: [] as Entry["attachments"], entryId: "" },
    ...((entries ?? []) as unknown as Entry[]).map((e) => ({
      id: e.id,
      direction: e.direction,
      who: e.direction === "out" ? [e.staff?.first_name, e.staff?.last_name].filter(Boolean).join(" ") || e.staff?.email || "Staff" : e.from_name || m.name,
      sub: e.direction === "out" ? `Reply from ${SITE.name}` : e.from_email,
      body: e.body_text,
      at: e.created_at,
      attachments: e.attachments ?? [],
      entryId: e.id,
    })),
  ];
  const btn = "text-[14px] font-semibold underline underline-offset-[3px] hover:text-gold";

  return (
    <div className="mt-6 flex flex-wrap gap-12">
      <div className="min-w-0 flex-[999_1_560px]">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={m.status} />
          <span className="text-[14px] text-muted">{timeline.length} {timeline.length === 1 ? "message" : "messages"}</span>
        </div>
        <h1 className="condensed mt-3 text-[34px] sm:text-[44px]">{m.name}</h1>
        <p className="mt-2 text-[16px]">
          <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
          {m.phone && <> · <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}>{m.phone}</a></>}
        </p>

        <ol className="mt-8 border-t-[3px] border-ink">
          {timeline.map((t) => (
            <li key={t.id} className={`border-b border-line py-5 ${t.direction === "out" ? "pl-6 sm:pl-12" : ""}`}>
              <div className={`border-l-[3px] pl-4 ${t.direction === "out" ? "border-gold" : "border-ink"}`}>
                <p className="flex flex-wrap items-baseline gap-x-3 text-[15px]">
                  <strong>{t.who}</strong>
                  <span className="text-[13px] text-muted">{t.sub}</span>
                  <span className="text-[13px] text-muted">{when.format(new Date(t.at))}</span>
                </p>
                <p className="mt-2 max-w-[720px] whitespace-pre-line break-words text-[16px]">{t.body}</p>
                {t.attachments.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
                    {t.attachments.map((a) => (
                      <li key={a.id}>
                        <a href={`/api/admin/attachment?entry=${t.entryId}&att=${encodeURIComponent(a.id)}`} className="underline" target="_blank" rel="noopener">
                          📎 {a.filename}{a.size ? ` (${Math.max(1, Math.round(a.size / 1024))} KB)` : ""}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>

        {m.status !== "spam" && (
          <section className="mt-8">
            <ReplyForm messageId={m.id} to={m.email} inboxReady={!!inboundDomain()} />
          </section>
        )}
      </div>

      <aside className="flex flex-[1_1_240px] flex-col gap-4">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Status</h2>
        <div className="flex flex-col items-start gap-3">
          {(["handled", "new", "spam"] as const).filter((s) => s !== m.status).map((s) => (
            <form key={s} action={setMessageStatus}>
              <input type="hidden" name="message_id" value={m.id} />
              <input type="hidden" name="status" value={s} />
              <button className={btn}>{s === "handled" ? "Mark handled" : s === "spam" ? "Mark as spam" : "Mark as new"}</button>
            </form>
          ))}
        </div>
        {m.status === "spam" && <p className="text-[13px] text-muted">Replies to a spam conversation are ignored.</p>}
      </aside>
    </div>
  );
}

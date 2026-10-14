import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams } from "@/lib/admin";
import { inboundDomain } from "@/lib/inbox";
import { SITE } from "@/lib/site";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultCount, StatusBadge, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Messages · Admin", robots: { index: false } };

export default function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <>
      <h1 className="condensed mb-2 text-[36px] sm:text-[44px]">Messages</h1>
      <p className="mb-6 text-[16px] text-body">
        From the contact form, including “Report this listing”. Reply here and their email replies come back to the same conversation.
      </p>
      <Suspense fallback={<Loading />}>
        <Messages searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: SITE.timezone });

type Row = {
  id: string; name: string; email: string; message: string; status: string; last_activity_at: string;
  entries: { direction: string; body_text: string; created_at: string }[];
};

async function Messages({ searchParams }: Pick<PageProps<"/admin/messages">, "searchParams">) {
  await requireStaff("/admin/messages");
  const p = listParams(await searchParams);
  const supabase = await createClient();
  let query = supabase
    .from("contact_messages")
    .select("id, name, email, message, status, last_activity_at, entries:contact_message_entries(direction, body_text, created_at)", { count: "exact" })
    .eq("site_id", SITE.id);
  if (p.status !== "all") query = query.eq("status", p.status);
  if (p.q) query = query.or(`name.ilike.${ilike(p.q)},email.ilike.${ilike(p.q)},message.ilike.${ilike(p.q)}`);
  const { data, count, error } = await query.order("last_activity_at", { ascending: false }).range(p.from, p.to);
  if (error) throw new Error(error.message);

  return (
    <>
      {!inboundDomain() && (
        <p className="mb-6 border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
          Replies you send go out by email now. To get their answers back here, finish the inbox setup (Resend receiving + webhook).
        </p>
      )}
      <Toolbar
        q={p.q}
        status={p.status}
        placeholder="Name, email or text"
        statuses={[
          { value: "all", label: "All" },
          { value: "new", label: "New" },
          { value: "handled", label: "Handled" },
          { value: "spam", label: "Spam" },
        ]}
      />
      <ResultCount count={count ?? 0} page={p.page} />
      <ul className="border-t-[3px] border-ink">
        {((data ?? []) as unknown as Row[]).map((m) => {
          const latest = [...m.entries].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
          const snippet = latest ? `${latest.direction === "out" ? "You: " : ""}${latest.body_text}` : m.message;
          return (
            <li key={m.id} className="border-b border-line">
              <Link href={`/admin/messages/${m.id}`} className="flex flex-wrap items-start gap-x-5 gap-y-1 py-4 hover:bg-wash hover:text-ink">
                <div className="min-w-0 flex-[1_1_420px]">
                  <p className="flex flex-wrap items-center gap-x-3 text-[16px]">
                    <strong className={m.status === "new" ? "" : "font-semibold"}>{m.name}</strong>
                    <span className="text-[14px] text-body">{m.email}</span>
                    {m.entries.length > 0 && <span className="font-mono text-[12px] text-muted">{m.entries.length + 1} messages</span>}
                  </p>
                  <p className="mt-1 line-clamp-1 max-w-[760px] text-[15px] text-body">{snippet}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="whitespace-nowrap text-[13px] text-muted">{when.format(new Date(m.last_activity_at))}</span>
                  <StatusBadge status={m.status} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status }} />
    </>
  );
}

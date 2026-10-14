import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ilike, listParams } from "@/lib/admin";
import { formatLongDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { setMessageStatus } from "@/app/admin/actions";
import { Loading } from "@/components/ui/Page";
import { Pager, ResultCount, StatusBadge, Toolbar } from "@/components/admin/List";

export const metadata: Metadata = { title: "Messages · Admin", robots: { index: false } };

export default function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <>
      <h1 className="condensed mb-2 text-[36px] sm:text-[44px]">Messages</h1>
      <p className="mb-6 text-[16px] text-body">From the contact form, including “Report this listing”. Every message is also emailed to staff.</p>
      <Suspense fallback={<Loading />}>
        <Messages searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Messages({ searchParams }: Pick<PageProps<"/admin/messages">, "searchParams">) {
  await requireStaff("/admin/messages");
  const p = listParams(await searchParams);
  const supabase = await createClient();
  let query = supabase.from("contact_messages").select("id, name, email, phone, message, status, created_at", { count: "exact" }).eq("site_id", SITE.id);
  if (p.status !== "all") query = query.eq("status", p.status);
  if (p.q) query = query.or(`name.ilike.${ilike(p.q)},email.ilike.${ilike(p.q)},message.ilike.${ilike(p.q)}`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(p.from, p.to);
  if (error) throw new Error(error.message);

  const btn = "text-[14px] font-semibold underline underline-offset-[3px] hover:text-gold";
  return (
    <>
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
        {(data ?? []).map((m) => (
          <li key={m.id} className="border-b border-line py-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-[17px] font-bold">{m.name}</p>
              <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
              {m.phone && <span className="text-body">{m.phone}</span>}
              <span className="text-[14px] text-muted">{formatLongDate(m.created_at)}</span>
              <StatusBadge status={m.status} />
            </div>
            <p className="mt-2 max-w-[760px] whitespace-pre-line text-[16px]">{m.message}</p>
            <div className="mt-3 flex flex-wrap gap-5">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to ${SITE.name}`)}`} className={btn}>Reply</a>
              {(["handled", "spam", "new"] as const).filter((s) => s !== m.status).map((s) => (
                <form key={s} action={setMessageStatus}>
                  <input type="hidden" name="message_id" value={m.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className={btn}>{s === "handled" ? "Mark handled" : s === "spam" ? "Spam" : "Mark new"}</button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <Pager count={count ?? 0} page={p.page} params={{ q: p.q, status: p.status }} />
    </>
  );
}

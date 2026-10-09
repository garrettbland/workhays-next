import { Suspense } from "react";
import Link from "next/link";
import { getMyEmployer } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { closeJob, renewAllJobs, renewJob, repostJob, setAutoRenew } from "@/app/dashboard/actions";
import { formatShortDate, isWithinDays } from "@/lib/format";
import { Badge, Loading } from "@/components/ui/Page";

export default function JobsPage({ params, searchParams }: PageProps<"/dashboard/[employerId]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Jobs params={params} searchParams={searchParams} />
    </Suspense>
  );
}

type Job = {
  id: string;
  title: string;
  status: "draft" | "active" | "expired" | "filled" | "archived";
  expires_at: string | null;
  bumped_at: string | null;
  auto_renew: boolean;
  updated_at: string;
};

const FLASH: Record<string, string> = {
  published: "Your job is live.",
  saved: "Saved.",
};

async function Jobs({ params, searchParams }: PageProps<"/dashboard/[employerId]">) {
  const { employerId } = await params;
  const sp = await searchParams;
  const { employer } = await getMyEmployer(employerId, `/dashboard/${employerId}`);
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, title, status, expires_at, bumped_at, auto_renew, updated_at")
    .eq("employer_id", employer.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  const jobs = (data ?? []) as Job[];

  const active = jobs.filter((j) => j.status === "active").sort((a, b) => (a.expires_at ?? "").localeCompare(b.expires_at ?? ""));
  const drafts = jobs.filter((j) => j.status === "draft");
  const expired = jobs.filter((j) => j.status === "expired");
  const closed = jobs.filter((j) => j.status === "filled" || j.status === "archived").slice(0, 20);
  const renewable = [...active.filter((j) => !j.auto_renew), ...expired];
  const flash = typeof sp.saved === "string" ? FLASH[sp.saved] : sp.joined ? `Welcome to the team at ${employer.name}.` : null;
  const approved = employer.status === "approved";
  const ctx = { employerId: employer.id };

  return (
    <>
      {flash && <p role="status" className="mb-6 border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">{flash}</p>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-body">
          Jobs stay up for 30 days. Renew to move a job back to the top, or turn on auto-renew to keep it up.
        </p>
        <div className="flex flex-wrap gap-2">
          {approved && renewable.length > 1 && (
            <form action={renewAllJobs}>
              <input type="hidden" name="employer_id" value={employer.id} />
              {renewable.map((j) => <input key={j.id} type="hidden" name="job_id" value={j.id} />)}
              <button type="submit" className="border-[1.5px] border-ink px-4 py-2.5 font-semibold hover:text-gold">Renew all ({renewable.length})</button>
            </form>
          )}
          <Link href={`/dashboard/${employer.id}/jobs/new`} className="bg-gold px-5 py-3 font-semibold text-white hover:bg-gold-dark hover:text-white">
            Post a job
          </Link>
        </div>
      </div>

      <Section title={`Live (${active.length})`} empty={approved ? "No live jobs. Post one to get started." : "Jobs go live once your business is approved."}>
        {active.map((j) => (
          <Row key={j.id} job={j} ctx={ctx} meta={
            <>
              {j.auto_renew ? <Badge tone="good">Auto-renew on</Badge> : isWithinDays(j.expires_at, 4) ? <Badge tone="gold">Expires {formatShortDate(j.expires_at)}</Badge> : <span className="text-muted">Expires {formatShortDate(j.expires_at)}</span>}
            </>
          }>
            {!j.auto_renew && <ActionButton action={renewJob} job={j} ctx={ctx} label="Renew" />}
            <form action={setAutoRenew}>
              <Hidden job={j} ctx={ctx} />
              <input type="hidden" name="on" value={j.auto_renew ? "0" : "1"} />
              <button type="submit" className="underline underline-offset-[3px] hover:text-gold">{j.auto_renew ? "Turn off auto-renew" : "Auto-renew"}</button>
            </form>
            <ActionButton action={closeJob} job={j} ctx={ctx} label="Mark filled" />
          </Row>
        ))}
      </Section>

      {drafts.length > 0 && (
        <Section title={`Drafts (${drafts.length})`}>
          {drafts.map((j) => (
            <Row key={j.id} job={j} ctx={ctx} meta={<span className="text-muted">Edited {formatShortDate(j.updated_at)}</span>}>
              <Link href={`/dashboard/${employer.id}/jobs/${j.id}`} className="underline underline-offset-[3px]">{approved ? "Review & publish" : "Edit"}</Link>
            </Row>
          ))}
        </Section>
      )}

      {expired.length > 0 && (
        <Section title={`Expired (${expired.length})`}>
          {expired.map((j) => (
            <Row key={j.id} job={j} ctx={ctx} meta={<span className="text-muted">Expired {formatShortDate(j.expires_at)}</span>}>
              {approved && <ActionButton action={repostJob} job={j} ctx={ctx} label="Repost for 30 days" />}
              <ActionButton action={closeJob} job={j} ctx={ctx} label="Mark filled" />
            </Row>
          ))}
        </Section>
      )}

      {closed.length > 0 && (
        <Section title="Filled & closed">
          {closed.map((j) => (
            <Row key={j.id} job={j} ctx={ctx} meta={<span className="capitalize text-muted">{j.status}</span>}>
              {approved && <ActionButton action={repostJob} job={j} ctx={ctx} label="Repost" />}
            </Row>
          ))}
        </Section>
      )}
    </>
  );
}

function Section({ title, empty, children }: { title: string; empty?: string; children: React.ReactNode }) {
  const has = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="mb-10">
      <h2 className="border-b border-ink pb-2 font-mono text-[13px] uppercase tracking-[0.08em]">{title}</h2>
      {has ? <ul>{children}</ul> : empty ? <p className="py-6 text-body">{empty}</p> : null}
    </section>
  );
}

function Row({ job, ctx, meta, children }: { job: Job; ctx: { employerId: string }; meta: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line py-4">
      <Link href={`/dashboard/${ctx.employerId}/jobs/${job.id}`} className="min-w-0 flex-[1_1_320px] text-[17px] font-bold">{job.title}</Link>
      <span className="text-[14px]">{meta}</span>
      <span className="flex flex-wrap items-center gap-4 text-[14px]">{children}</span>
    </li>
  );
}

function Hidden({ job, ctx }: { job: Job; ctx: { employerId: string } }) {
  return (
    <>
      <input type="hidden" name="job_id" value={job.id} />
      <input type="hidden" name="employer_id" value={ctx.employerId} />
    </>
  );
}

function ActionButton({ action, job, ctx, label }: { action: (f: FormData) => Promise<void>; job: Job; ctx: { employerId: string }; label: string }) {
  return (
    <form action={action}>
      <Hidden job={job} ctx={ctx} />
      <button type="submit" className="underline underline-offset-[3px] hover:text-gold">{label}</button>
    </form>
  );
}

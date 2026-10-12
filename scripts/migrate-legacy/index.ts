/**
 * One-way migration from the legacy Work Hays MySQL database into Supabase Postgres.
 *
 *   LEGACY_MYSQL_URL=mysql://user:pass@host:port/db \
 *   TARGET_DATABASE_URL=postgres://postgres:pass@db.<project>.supabase.co:5432/postgres \
 *   npx tsx scripts/migrate-legacy/index.ts [--dry-run] [--replace] [--decisions=path.csv]
 *
 * --dry-run     classify and report, write nothing
 * --replace     delete previously migrated Work Hays data first (safe to re-run against dev)
 * --decisions   CSV with columns email,decision (keep|drop); "drop" removes extra accounts (only verified accounts are ever migrated)
 *
 * Users keep their passwords: legacy bcrypt hashes ($2a$) are copied into auth.users,
 * which Supabase Auth verifies natively. Legacy UUIDs are preserved so old URLs keep working.
 */
import fs from "node:fs";
import mysql from "mysql2/promise";
import pg from "pg";
import { sanitizeRichText } from "../../src/lib/sanitize";
import { classifyAccount, type LegacyUser, type LegacyEmployer, type Decision, type Verdict } from "./classify";

const SITE_ID = "00000000-0000-4000-8000-000000000001";
const LEGACY_POSTING_DAYS = 14;

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"] as const;
  }),
);
const DRY_RUN = args.has("dry-run");
const REPLACE = args.has("replace");

type LegacyJob = {
  id: string;
  employer_id: string;
  title: string;
  job_type: "full_time" | "part_time";
  description: string | null;
  application_link: string | null;
  renewed: Date;
  status: "active" | "inactive" | "archived";
  industry: string | null;
  created_at: Date;
  updated_at: Date;
};
type LegacySubscriber = { id: string; email: string; created_at: Date };

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function loadDecisions(path?: string): Map<string, Decision> {
  const map = new Map<string, Decision>();
  if (!path) return map;
  const rows = fs.readFileSync(path, "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const header = rows.shift()!.toLowerCase().split(",");
  const emailCol = header.findIndex((h) => h.trim() === "email");
  const decisionCol = header.findIndex((h) => h.trim().startsWith("decision"));
  for (const line of rows) {
    const cols = parseCsvLine(line);
    const email = cols[emailCol]?.trim().toLowerCase();
    const d = cols[decisionCol]?.trim().toLowerCase();
    if (email && (d === "keep" || d === "drop")) map.set(email, d);
  }
  return map;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function normalizeLink(link: string | null): { url: string | null; email: string | null } {
  const v = link?.trim();
  if (!v) return { url: null, email: null };
  if (/^mailto:/i.test(v)) return { url: null, email: v.replace(/^mailto:/i, "") };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { url: null, email: v };
  if (/^https?:\/\//i.test(v)) return { url: v, email: null };
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)) return { url: `https://${v}`, email: null };
  return { url: null, email: null };
}

function cleanUrl(v: string | null): string | null {
  const s = v?.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

async function main() {
  const decisions = loadDecisions(args.get("decisions"));
  const my = await mysql.createConnection({ uri: env("LEGACY_MYSQL_URL"), dateStrings: false, timezone: "Z" });

  const [users] = (await my.query("select * from users")) as unknown as [LegacyUser[]];
  const [employers] = (await my.query("select * from employers")) as unknown as [LegacyEmployer[]];
  const [jobs] = (await my.query("select * from jobs")) as unknown as [LegacyJob[]];
  const [subscribers] = (await my.query("select * from subscribers")) as unknown as [LegacySubscriber[]];
  await my.end();

  // ---- Classify ----------------------------------------------------------
  const jobsByEmployer = new Map<string, LegacyJob[]>();
  for (const j of jobs) {
    const list = jobsByEmployer.get(j.employer_id) ?? [];
    list.push(j);
    jobsByEmployer.set(j.employer_id, list);
  }
  const employerByUser = new Map<string, LegacyEmployer>();
  for (const e of employers) if (e.user_id && e.user_id !== "unclaimed") employerByUser.set(e.user_id, e);

  const keptUsers: LegacyUser[] = [];
  const counts: Record<string, number> = {};
  const seenEmails = new Map<string, LegacyUser>();

  // Users with jobs/verified first so duplicates resolve in their favor.
  const ordered = [...users].sort((a, b) => score(b) - score(a));
  function score(u: LegacyUser) {
    const e = employerByUser.get(u.id);
    return (e && jobsByEmployer.get(e.id)?.length ? 2 : 0) + (u.status === "verified" ? 1 : 0);
  }

  for (const u of ordered) {
    const employer = employerByUser.get(u.id);
    const jobCount = employer ? jobsByEmployer.get(employer.id)?.length ?? 0 : 0;
    const email = u.email?.trim().toLowerCase();
    let verdict: Verdict = classifyAccount(u, employer, jobCount);
    const override = email ? decisions.get(email) : undefined;
    // Overrides can only drop accounts; an unverified account is never brought over.
    if (override === "drop" && u.role !== "admin") verdict = "drop";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) verdict = "drop";
    if (verdict === "keep" && seenEmails.has(email!)) verdict = "duplicate";
    counts[verdict] = (counts[verdict] ?? 0) + 1;
    if (verdict === "keep") {
      keptUsers.push(u);
      seenEmails.set(email!, u);
    }
  }

  const keptUserIds = new Set(keptUsers.map((u) => u.id));
  const keptEmployers = employers.filter((e) => {
    // Admin-created "unclaimed" listings are not migrated (decided 2026-10-12); their jobs stay behind too.
    if (e.user_id === "unclaimed") return false;
    return keptUserIds.has(e.user_id) && (nonEmpty(e.title) !== null || (jobsByEmployer.get(e.id)?.length ?? 0) > 0);
  });
  const keptEmployerIds = new Set(keptEmployers.map((e) => e.id));
  const keptJobs = jobs.filter((j) => keptEmployerIds.has(j.employer_id) && nonEmpty(j.title) !== null);

  const subsByEmail = new Map<string, LegacySubscriber>();
  for (const s of subscribers) {
    const email = s.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    const prev = subsByEmail.get(email);
    if (!prev || prev.created_at > s.created_at) subsByEmail.set(email, s);
  }

  const now = Date.now();
  const jobStatus = (j: LegacyJob) => {
    const expires = new Date(j.renewed).getTime() + LEGACY_POSTING_DAYS * 86400_000;
    if (j.status === "archived") return "archived";
    if (j.status === "active" && expires > now) return "active";
    return "expired";
  };

  const report = {
    legacy: { users: users.length, employers: employers.length, jobs: jobs.length, subscribers: subscribers.length },
    accounts: counts,
    migrating: {
      users: keptUsers.length,
      staff: keptUsers.filter((u) => u.role === "admin" || u.role === "moderator").length,
      employers: keptEmployers.length,
      approvedEmployers: keptEmployers.filter((e) => e.user_id === "unclaimed" ||
        keptUsers.find((u) => u.id === e.user_id)?.status === "verified").length,
      claimableEmployers: keptEmployers.filter((e) => e.user_id === "unclaimed").length,
      jobs: keptJobs.length,
      liveJobs: keptJobs.filter((j) => jobStatus(j) === "active").length,
      skippedJobs: jobs.length - keptJobs.length,
      subscribers: subsByEmail.size,
      logos: keptEmployers.filter((e) => nonEmpty(e.logo_url)).length,
    },
  };
  console.log(JSON.stringify(report, null, 2));
  if (DRY_RUN) return;

  // ---- Write -------------------------------------------------------------
  const db = new pg.Client({ connectionString: env("TARGET_DATABASE_URL") });
  await db.connect();
  try {
    await db.query("begin");

    if (REPLACE) {
      await db.query("delete from public.employers where site_id = $1", [SITE_ID]);
      await db.query("delete from public.subscribers where site_id = $1", [SITE_ID]);
      await db.query("delete from auth.users where (raw_app_meta_data ->> 'legacy_import') = 'workhays'");
    } else {
      const { rows } = await db.query("select count(*)::int as n from public.employers where site_id = $1", [SITE_ID]);
      if (rows[0].n > 0) throw new Error("Target already has Work Hays data. Re-run with --replace (dev only).");
    }

    for (const u of keptUsers) {
      const email = u.email.trim().toLowerCase();
      const created = u.created_at ?? new Date();
      const meta = { first_name: nonEmpty(u.first_name), last_name: nonEmpty(u.last_name) };
      await db.query(
        `insert into auth.users (
           instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           email_change_token_current, phone_change, phone_change_token, reauthentication_token,
           is_sso_user, is_anonymous, banned_until)
         values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, $3, $4,
           $5, $6, $7, $8, '', '', '', '', '', '', '', '', false, false, $9)`,
        [
          u.id, email, u.password,
          // Approved accounts have been signing in with this email for years; others must confirm it.
          u.status === "verified" ? created : null,
          JSON.stringify({ provider: "email", providers: ["email"], legacy_import: "workhays" }),
          JSON.stringify(meta), created, u.updated_at ?? created,
          u.status === "locked" ? "2999-01-01T00:00:00Z" : null,
        ],
      );
      await db.query(
        `insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
         values ($1::text, $2::uuid, $3, 'email', $4, $4)`,
        [u.id, u.id, JSON.stringify({ sub: u.id, email, email_verified: u.status === "verified" }), created],
      );
      if (u.role === "admin" || u.role === "moderator") {
        await db.query(
          "insert into public.site_staff (site_id, user_id, role) values ($1, $2, $3)",
          [SITE_ID, u.id, u.role === "admin" ? "admin" : "moderator"],
        );
      }
    }

    const userById = new Map(keptUsers.map((u) => [u.id, u]));
    for (const e of keptEmployers) {
      const owner = e.user_id === "unclaimed" ? null : userById.get(e.user_id)!;
      const approved = !owner || owner.status === "verified";
      const name = nonEmpty(e.title) ??
        (nonEmpty(`${owner?.first_name ?? ""} ${owner?.last_name ?? ""}`) || "Unnamed employer");
      await db.query(
        `insert into public.employers (
           id, site_id, name, description_html, contact_name, email, phone, website_url,
           facebook_url, instagram_url, x_url, youtube_url, logo_path, header_image_path,
           status, is_claimable, reviewed_at, created_by, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          e.id, SITE_ID, name.slice(0, 200), sanitizeRichText(e.description) || null,
          nonEmpty(e.contact), nonEmpty(e.email)?.toLowerCase() ?? null, nonEmpty(e.phone),
          cleanUrl(e.website_url), cleanUrl(e.facebook_url), cleanUrl(e.instagram_url),
          cleanUrl(e.twitter_url), cleanUrl(e.youtube_url),
          legacyUpload(e.logo_url), legacyUpload(e.header_image_url),
          approved ? "approved" : "pending", !owner, approved ? e.updated_at : null,
          owner?.id ?? null, e.created_at, e.updated_at,
        ],
      );
      if (owner) {
        await db.query(
          "insert into public.employer_members (employer_id, user_id, role, created_at) values ($1, $2, 'owner', $3)",
          [e.id, owner.id, e.created_at],
        );
      }
    }

    const validIndustries = new Set(
      (await db.query("select slug from public.industries where site_id = $1", [SITE_ID])).rows.map((r) => r.slug),
    );
    for (const j of keptJobs) {
      const status = jobStatus(j);
      const link = normalizeLink(j.application_link);
      const industry = j.industry && validIndustries.has(j.industry) ? j.industry : null;
      const renewed = new Date(j.renewed);
      const owner = employers.find((e) => e.id === j.employer_id)?.user_id;
      await db.query(
        `insert into public.jobs (
           id, site_id, employer_id, title, description_html, job_type, industry,
           application_url, application_email, status, published_at, bumped_at, expires_at,
           closed_at, created_by, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          j.id, SITE_ID, j.employer_id, j.title.trim().slice(0, 300), sanitizeRichText(j.description),
          j.job_type, industry, link.url, link.email, status, j.created_at, renewed,
          new Date(renewed.getTime() + LEGACY_POSTING_DAYS * 86400_000),
          status === "archived" ? j.updated_at : null,
          owner && keptUserIds.has(owner) ? owner : null, j.created_at, j.updated_at,
        ],
      );
    }

    for (const [email, s] of subsByEmail) {
      await db.query(
        `insert into public.subscribers (id, site_id, email, status, confirmed_at, source, created_at)
         values ($1, $2, $3, 'confirmed', $4, 'legacy', $4)`,
        [s.id, SITE_ID, email, s.created_at],
      );
    }

    await db.query(
      `insert into public.audit_log (site_id, action, entity_type, data) values ($1, 'legacy.imported', 'site', $2)`,
      [SITE_ID, JSON.stringify(report)],
    );
    await db.query("commit");
    console.log("Migration committed.");
  } catch (err) {
    await db.query("rollback");
    throw err;
  } finally {
    await db.end();
  }
}

/** Legacy uploads live on the old server at public/uploads/employers/<file>; see upload-logos.ts. */
function legacyUpload(v: string | null): string | null {
  const s = nonEmpty(v);
  if (!s) return null;
  const file = s.split("/").pop();
  return file ? `legacy/${file}` : null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

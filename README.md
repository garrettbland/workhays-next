# Work Hays (next)

The rebuild of [workhays.com](https://workhays.com): a local jobs and events board, built to run many sites from one codebase.

- **App:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind 4, hosted on Vercel
- **Data/Auth/Storage:** Supabase (Postgres + row-level security, Auth with email verification and TOTP 2FA)
- **Email:** Resend · **CAPTCHA:** Cloudflare Turnstile · **Payments (later):** Stripe

The full plan lives in the Work Hays project doc `workhays-rebuild-plan.md`.

## Layout

```
src/
  app/                    routes
  lib/
    env.ts                public env (validated)
    env.server.ts         server secrets (server-only)
    supabase/
      server.ts           acts as the signed-in user (cookies)
      public.ts           anonymous, cache-safe reads
      admin.ts            service role, bypasses RLS (server-only)
      client.ts           browser client
    jobs.ts               cached public job queries
    sanitize.ts           the one rich-text sanitizer
  proxy.ts                refreshes the auth session (Next 16 "proxy", formerly middleware)
supabase/
  migrations/             schema, access rules, RPCs, seed for site #1, storage
  tests/database/         pgTAP tests for the access rules and flows
scripts/
  migrate-legacy/         MySQL -> Supabase migration + logo upload
  db-test-local.sh        run the DB tests on plain Postgres (no Docker)
```

## Environments

| | Supabase project | Vercel |
|---|---|---|
| dev | `workhays-dev` | Preview deployments (every branch/PR) |
| prod | `workhays-prod` | Production (`main`) |

Schema changes are migration files. Apply to dev first, then prod:

```bash
npx supabase link --project-ref <dev-ref> && npm run db:push
npx supabase link --project-ref <prod-ref> && npm run db:push
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the dev project's values
npm run dev
```

Checks: `npm run lint`, `npm run typecheck`, `npm run db:test` (Supabase CLI + Docker) or `npm run db:test:local` (plain Postgres with pgTAP).

## How the data rules work

- Every tenant row has `site_id`. Site #1 (Work Hays) is `00000000-0000-4000-8000-000000000001`.
- **Employers** start `pending`; a site moderator/admin approves them (`review_employer`). Only approved employers are public, and only they can publish jobs.
- **Teams:** `employer_members` with roles `owner` / `admin` / `member`. Invites are emailed tokens; the invitee accepts or declines on the invite page (`get_employer_invite`, `respond_to_employer_invite`). Owners can remove anyone else and transfer ownership; admins can remove members; anyone but the owner can leave.
- **Jobs:** publishing sets a 30-day expiry (site setting `posting_days`). `renew_job` bumps to the top and extends. Auto-renew extends without bumping and asks "still hiring?" every 60 days; unanswered for 7 days, it turns off. The daily cron calls `run_job_maintenance`.
- **One-click email links** (`action_tokens`): renew, mark filled, confirm auto-renew, confirm/unsubscribe newsletter. The GET page only *shows* the action (`get_action_token`); a button POSTs to perform it (`use_action_token`), because mail scanners open every link.
- **Events:** businesses publish directly once approved; public submissions (no account) are always `pending` until a moderator approves.
- **Featured jobs:** `promotions` rows (Stripe later) drive `jobs.featured_until`; featured jobs sort first.
- Guard triggers stop non-staff from changing status/review/featured/expiry columns, even though RLS lets them edit the row.

## Legacy migration

```bash
LEGACY_MYSQL_URL=mysql://... TARGET_DATABASE_URL=postgres://postgres:...@db.<ref>.supabase.co:5432/postgres \
  npm run migrate:legacy -- --dry-run          # report only
  npm run migrate:legacy -- --replace          # (re)load into dev
  npm run migrate:legacy -- --decisions=reviewed.csv   # apply keep/drop overrides
```

Users keep their passwords (bcrypt hashes are copied into Supabase Auth) and IDs, so `/jobs/:id` and `/employers/:id` URLs survive. Logos: see `scripts/migrate-legacy/upload-logos.ts`.

-- Work Hays platform: core schema
-- Multi-site from day one: every tenant-owned row carries site_id.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.staff_role        as enum ('moderator', 'admin');
create type public.employer_status   as enum ('pending', 'approved', 'denied', 'suspended');
create type public.member_role       as enum ('owner', 'admin', 'member');
create type public.invite_status     as enum ('pending', 'accepted', 'declined', 'revoked', 'expired');
create type public.review_status     as enum ('pending', 'approved', 'rejected');
create type public.job_type          as enum ('full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship');
create type public.job_status        as enum ('draft', 'active', 'expired', 'filled', 'archived');
create type public.subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');
create type public.promotion_kind    as enum ('featured_job', 'ad');
create type public.promotion_status  as enum ('pending', 'active', 'expired', 'canceled', 'refunded');
create type public.action_purpose    as enum (
  'job_renew', 'job_close', 'job_confirm_auto_renew', 'subscriber_confirm', 'subscriber_unsubscribe'
);

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Sites (tenants)
-- ---------------------------------------------------------------------------
create table public.sites (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  tagline        text,
  primary_domain text not null unique,
  timezone       text not null default 'America/Chicago',
  -- posting_days, reminder_days_before, auto_renew_confirm_days, auto_renew_grace_days,
  -- require_employer_approval, from_email, brand colors, etc.
  settings       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger sites_updated_at before update on public.sites
  for each row execute function public.set_updated_at();

create table public.site_domains (
  domain  text primary key check (domain = lower(domain)),
  site_id uuid not null references public.sites(id) on delete cascade
);

-- Typed accessor for numeric site settings with a default.
create or replace function public.site_setting_int(p_site_id uuid, p_key text, p_default int)
returns int language sql stable set search_path = '' as $$
  select coalesce((select (s.settings ->> p_key)::int from public.sites s where s.id = p_site_id), p_default)
$$;

create table public.industries (
  site_id    uuid not null references public.sites(id) on delete cascade,
  slug       text not null,
  name       text not null,
  sort_order int  not null default 0,
  primary key (site_id, slug)
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  first_name text,
  last_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Keep profiles in sync with Supabase Auth.
create or replace function public.handle_auth_user_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, email, first_name, last_name)
    values (
      new.id, new.email,
      nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
    )
    on conflict (id) do nothing;
  elsif new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_change
  after insert or update of email on auth.users
  for each row execute function public.handle_auth_user_change();

-- Platform staff per site (moderators approve; admins also manage settings and staff).
create table public.site_staff (
  site_id    uuid not null references public.sites(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.staff_role not null,
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Employers and teams
-- ---------------------------------------------------------------------------
create table public.employers (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references public.sites(id) on delete cascade,
  name              text not null check (length(trim(name)) > 0),
  description_html  text,
  contact_name      text,
  email             text,
  phone             text,
  website_url       text,
  facebook_url      text,
  instagram_url     text,
  linkedin_url      text,
  x_url             text,
  youtube_url       text,
  logo_path         text,
  header_image_path text,
  status            public.employer_status not null default 'pending',
  -- Admin-created listing with no owner yet that a real business can claim.
  is_claimable      boolean not null default false,
  status_reason     text,
  reviewed_by       uuid references public.profiles(id) on delete set null,
  reviewed_at       timestamptz,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index employers_site_status_idx on public.employers (site_id, status);
create index employers_site_name_idx on public.employers (site_id, lower(name));
create trigger employers_updated_at before update on public.employers
  for each row execute function public.set_updated_at();

create table public.employer_members (
  employer_id uuid not null references public.employers(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.member_role not null,
  added_by    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (employer_id, user_id)
);
create unique index employer_one_owner_idx on public.employer_members (employer_id) where role = 'owner';
create index employer_members_user_idx on public.employer_members (user_id);

create table public.employer_invites (
  id           uuid primary key default gen_random_uuid(),
  employer_id  uuid not null references public.employers(id) on delete cascade,
  email        text not null check (email = lower(trim(email))),
  role         public.member_role not null check (role <> 'owner'),
  token_hash   text not null unique,
  status       public.invite_status not null default 'pending',
  invited_by   uuid references public.profiles(id) on delete set null,
  expires_at   timestamptz not null default now() + interval '7 days',
  responded_at timestamptz,
  created_at   timestamptz not null default now()
);
create unique index employer_invites_one_pending_idx
  on public.employer_invites (employer_id, email) where status = 'pending';

create table public.employer_claims (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text,
  status      public.review_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index employer_claims_one_pending_idx
  on public.employer_claims (employer_id, user_id) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create table public.jobs (
  id                       uuid primary key default gen_random_uuid(),
  site_id                  uuid not null references public.sites(id) on delete cascade,
  employer_id              uuid not null references public.employers(id) on delete cascade,
  title                    text not null check (length(trim(title)) > 0),
  description_html         text not null default '',
  job_type                 public.job_type not null default 'full_time',
  industry                 text,
  location                 text,
  pay_min                  numeric(12,2),
  pay_max                  numeric(12,2),
  pay_period               text check (pay_period in ('hour', 'week', 'month', 'year')),
  application_url          text,
  application_email        text,
  status                   public.job_status not null default 'draft',
  published_at             timestamptz,
  -- Sort key for the public list. Only an active renewal moves it; auto-renew does not.
  bumped_at                timestamptz,
  expires_at               timestamptz,
  -- Set from paid promotions; featured jobs pin above everything else.
  featured_until           timestamptz,
  auto_renew               boolean not null default false,
  auto_renew_confirmed_at  timestamptz,
  auto_renew_check_sent_at timestamptz,
  expiry_reminder_sent_at  timestamptz,
  closed_at                timestamptz,
  created_by               uuid references public.profiles(id) on delete set null,
  updated_by               uuid references public.profiles(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  deleted_at               timestamptz,
  foreign key (site_id, industry) references public.industries(site_id, slug) on update cascade,
  check (pay_max is null or pay_min is null or pay_max >= pay_min)
);
create index jobs_public_list_idx on public.jobs (site_id, featured_until desc nulls last, bumped_at desc)
  where status = 'active' and deleted_at is null;
create index jobs_employer_idx on public.jobs (employer_id);
create index jobs_expiry_idx on public.jobs (status, expires_at) where deleted_at is null;
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references public.sites(id) on delete cascade,
  employer_id      uuid references public.employers(id) on delete cascade,
  title            text not null check (length(trim(title)) > 0),
  description_html text not null default '',
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  all_day          boolean not null default false,
  location_name    text,
  address          text,
  event_url        text,
  image_path       text,
  is_job_fair      boolean not null default false,
  status           public.review_status not null default 'pending',
  -- Public submissions (no account)
  submitter_name   text,
  submitter_email  text,
  review_note      text,
  reviewed_by      uuid references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  check (ends_at is null or ends_at >= starts_at),
  check (employer_id is not null or created_by is not null or submitter_email is not null)
);
create index events_public_idx on public.events (site_id, starts_at) where status = 'approved' and deleted_at is null;
create index events_pending_idx on public.events (site_id, created_at) where status = 'pending';
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Newsletter, contact, tokens, audit
-- ---------------------------------------------------------------------------
create table public.subscribers (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references public.sites(id) on delete cascade,
  email             text not null check (email = lower(trim(email))),
  status            public.subscriber_status not null default 'pending',
  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz,
  resend_contact_id text,
  source            text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (site_id, email)
);
create trigger subscribers_updated_at before update on public.subscribers
  for each row execute function public.set_updated_at();

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'handled', 'spam')),
  created_at timestamptz not null default now()
);

-- Single-use links that act without logging in (renew a job from an email, etc.).
-- Only a SHA-256 hash of the token is stored.
create table public.action_tokens (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  token_hash text not null unique,
  purpose    public.action_purpose not null,
  target_id  uuid not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index action_tokens_target_idx on public.action_tokens (target_id, purpose);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  site_id     uuid references public.sites(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_site_idx on public.audit_log (site_id, created_at desc);

create table public.blocked_signups (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid references public.sites(id) on delete cascade, -- null = all sites
  kind       text not null check (kind in ('email', 'domain')),
  value      text not null check (value = lower(trim(value))),
  reason     text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index blocked_signups_unique_idx on public.blocked_signups (coalesce(site_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, value);

-- ---------------------------------------------------------------------------
-- Payments (structure reserved; Stripe wiring comes later)
-- ---------------------------------------------------------------------------
create table public.promotions (
  id                         uuid primary key default gen_random_uuid(),
  site_id                    uuid not null references public.sites(id) on delete cascade,
  employer_id                uuid references public.employers(id) on delete set null,
  job_id                     uuid references public.jobs(id) on delete set null,
  kind                       public.promotion_kind not null,
  status                     public.promotion_status not null default 'pending',
  starts_at                  timestamptz,
  ends_at                    timestamptz,
  amount_cents               int check (amount_cents >= 0),
  currency                   text not null default 'usd',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text,
  created_by                 uuid references public.profiles(id) on delete set null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  check (kind <> 'featured_job' or job_id is not null)
);
create trigger promotions_updated_at before update on public.promotions
  for each row execute function public.set_updated_at();

create table public.ads (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  employer_id  uuid references public.employers(id) on delete set null,
  promotion_id uuid references public.promotions(id) on delete set null,
  placement    text not null,
  image_path   text,
  link_url     text,
  alt_text     text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger ads_updated_at before update on public.ads
  for each row execute function public.set_updated_at();

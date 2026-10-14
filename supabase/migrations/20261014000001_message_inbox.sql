-- Contact messages become conversations: staff reply from the admin, and people's email
-- replies come back in through Resend Inbound to a per-conversation address
-- (c-<reply_token>@<inbound domain>).

alter table public.contact_messages
  add column reply_token text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  add column last_activity_at timestamptz not null default now();

update public.contact_messages set last_activity_at = created_at;

create index contact_messages_activity_idx on public.contact_messages (site_id, last_activity_at desc);

-- Each email in a conversation after the original contact-form message.
create table public.contact_message_entries (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references public.contact_messages(id) on delete cascade,
  site_id       uuid not null references public.sites(id) on delete cascade,
  direction     text not null check (direction in ('in', 'out')),
  from_email    text not null,
  from_name     text,
  body_text     text not null default '',
  -- Staff member who wrote an outgoing reply
  staff_user_id uuid references public.profiles(id) on delete set null,
  -- Resend's id for the received email (makes webhook retries harmless)
  email_id      text unique,
  -- RFC Message-ID, used for In-Reply-To / References so replies thread in mail apps
  rfc_message_id text,
  -- [{ id, filename, content_type, size }] for received attachments (downloaded on demand)
  attachments   jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);
create index contact_message_entries_message_idx on public.contact_message_entries (message_id, created_at);

-- One "please use the contact form" auto-reply per sender per day.
create table public.inbound_auto_replies (
  site_id     uuid not null references public.sites(id) on delete cascade,
  email       text not null,
  last_sent_at timestamptz not null default now(),
  primary key (site_id, email)
);

alter table public.contact_message_entries enable row level security;
alter table public.inbound_auto_replies enable row level security;

-- Staff read conversations and add their own replies. Incoming email is written server-side
-- with the service role. The auto-reply log is server-only (no policies).
create policy contact_message_entries_staff_read on public.contact_message_entries for select to authenticated
  using (public.is_site_staff(site_id));
create policy contact_message_entries_staff_reply on public.contact_message_entries for insert to authenticated
  with check (
    public.is_site_staff(site_id)
    and direction = 'out'
    and staff_user_id = (select auth.uid())
    and site_id = (select m.site_id from public.contact_messages m where m.id = message_id)
  );

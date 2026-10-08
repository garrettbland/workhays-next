-- Access rules: helper functions, guard triggers, row-level security.
--
-- Model:
--   anon/authenticated  -> constrained by RLS + guard triggers
--   service_role        -> server-only code (cron, webhooks, public form handlers); bypasses RLS
--   security definer RPCs (next migration) -> do their own permission checks

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when running as trusted server code (service role, migrations, or inside a security definer RPC).
create or replace function public.is_privileged() returns boolean
language sql stable set search_path = '' as $$
  select current_user not in ('anon', 'authenticated')
$$;

create or replace function public.is_site_staff(p_site_id uuid, p_min public.staff_role default 'moderator')
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.site_staff s
    where s.site_id = p_site_id
      and s.user_id = (select auth.uid())
      and (p_min = 'moderator' or s.role = 'admin')
  )
$$;

create or replace function public.is_any_site_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.site_staff s where s.user_id = (select auth.uid()))
$$;

create or replace function public.employer_site_id(p_employer_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select site_id from public.employers where id = p_employer_id
$$;

create or replace function public.employer_is_approved(p_employer_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.employers where id = p_employer_id and status = 'approved')
$$;

create or replace function public.has_employer_role(
  p_employer_id uuid,
  p_roles public.member_role[] default array['owner', 'admin', 'member']::public.member_role[]
) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.employer_members m
    where m.employer_id = p_employer_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  )
$$;

create or replace function public.shares_employer_with(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.employer_members mine
    join public.employer_members theirs on theirs.employer_id = mine.employer_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  )
$$;

create or replace function public.log_audit(
  p_site_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_data jsonb default '{}'::jsonb
) returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (site_id, actor_id, action, entity_type, entity_id, data)
  values (p_site_id, (select auth.uid()), p_action, p_entity_type, p_entity_id, coalesce(p_data, '{}'::jsonb))
$$;

-- Internal: only callable from security definer RPCs / server code.
revoke execute on function public.log_audit(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guard triggers (enforce what RLS can't express: which columns a role may change)
-- ---------------------------------------------------------------------------

create or replace function public.guard_employer() returns trigger
language plpgsql set search_path = '' as $$
begin
  if public.is_privileged() or public.is_site_staff(old.site_id) then
    return new;
  end if;
  if new.site_id is distinct from old.site_id
     or new.status is distinct from old.status
     or new.status_reason is distinct from old.status_reason
     or new.is_claimable is distinct from old.is_claimable
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.created_by is distinct from old.created_by then
    raise exception 'Only staff can change an employer''s status or review fields'
      using errcode = '42501';
  end if;
  return new;
end $$;
create trigger employers_guard before update on public.employers
  for each row execute function public.guard_employer();

create or replace function public.guard_job() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_trusted boolean := public.is_privileged();
  v_site uuid;
  v_activating boolean;
begin
  select site_id into v_site from public.employers where id = new.employer_id;
  if v_site is null then
    raise exception 'Employer not found';
  end if;
  new.site_id := v_site;
  v_trusted := v_trusted or public.is_site_staff(v_site);

  if not v_trusted then
    if tg_op = 'INSERT' then
      new.created_by := (select auth.uid());
      new.featured_until := null;
      new.published_at := null;
      new.bumped_at := null;
      new.expires_at := null;
      new.closed_at := null;
      new.expiry_reminder_sent_at := null;
      new.auto_renew_check_sent_at := null;
    else
      if new.employer_id is distinct from old.employer_id then
        raise exception 'A job cannot be moved to another employer' using errcode = '42501';
      end if;
      new.created_by := old.created_by;
      new.featured_until := old.featured_until;
      new.published_at := old.published_at;
      new.bumped_at := old.bumped_at;
      new.expires_at := old.expires_at;
      new.expiry_reminder_sent_at := old.expiry_reminder_sent_at;
      new.auto_renew_check_sent_at := old.auto_renew_check_sent_at;
    end if;
    new.updated_by := (select auth.uid());
  end if;

  v_activating := new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active');

  if v_activating then
    if not public.employer_is_approved(new.employer_id) and not public.is_privileged() then
      raise exception 'Jobs can be published once the business is approved' using errcode = '42501';
    end if;
    if not v_trusted or new.expires_at is null or new.expires_at <= now() then
      new.published_at := coalesce(new.published_at, now());
      new.bumped_at := now();
      new.expires_at := now() + make_interval(days => public.site_setting_int(v_site, 'posting_days', 30));
      new.expiry_reminder_sent_at := null;
    end if;
    new.closed_at := null;
  end if;

  if new.status in ('filled', 'archived')
     and (tg_op = 'INSERT' or old.status not in ('filled', 'archived')) then
    new.closed_at := coalesce(new.closed_at, now());
    new.auto_renew := false;
  end if;

  if new.auto_renew and (tg_op = 'INSERT' or not old.auto_renew) then
    new.auto_renew_confirmed_at := now();
    new.auto_renew_check_sent_at := null;
  end if;

  return new;
end $$;
create trigger jobs_guard before insert or update on public.jobs
  for each row execute function public.guard_job();

create or replace function public.guard_event() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_staff boolean;
begin
  if new.employer_id is not null then
    new.site_id := public.employer_site_id(new.employer_id);
  end if;
  v_staff := public.is_site_staff(new.site_id);

  if tg_op = 'INSERT' then
    if v_staff then
      new.status := coalesce(new.status, 'approved');
    elsif new.employer_id is not null and not public.is_privileged() then
      -- Businesses publish directly once approved; otherwise it waits for review.
      new.created_by := (select auth.uid());
      new.status := case when public.employer_is_approved(new.employer_id) then 'approved' else 'pending' end;
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif new.employer_id is null and not v_staff then
      -- Public submissions always need moderator approval.
      new.status := 'pending';
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
  elsif not (v_staff or public.is_privileged()) then
    if new.status is distinct from old.status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.employer_id is distinct from old.employer_id
       or new.site_id is distinct from old.site_id then
      raise exception 'Only staff can change an event''s status' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger events_guard before insert or update on public.events
  for each row execute function public.guard_event();

-- Paid featured placements drive jobs.featured_until.
create or replace function public.sync_featured_job() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_job uuid := coalesce(new.job_id, old.job_id);
begin
  if v_job is not null then
    update public.jobs j set featured_until = (
      select max(p.ends_at) from public.promotions p
      where p.job_id = v_job and p.kind = 'featured_job' and p.status = 'active'
    ) where j.id = v_job;
  end if;
  return null;
end $$;
create trigger promotions_sync_featured after insert or update or delete on public.promotions
  for each row execute function public.sync_featured_job();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.sites            enable row level security;
alter table public.site_domains     enable row level security;
alter table public.industries       enable row level security;
alter table public.profiles         enable row level security;
alter table public.site_staff       enable row level security;
alter table public.employers        enable row level security;
alter table public.employer_members enable row level security;
alter table public.employer_invites enable row level security;
alter table public.employer_claims  enable row level security;
alter table public.jobs             enable row level security;
alter table public.events           enable row level security;
alter table public.subscribers      enable row level security;
alter table public.contact_messages enable row level security;
alter table public.action_tokens    enable row level security;
alter table public.audit_log        enable row level security;
alter table public.blocked_signups  enable row level security;
alter table public.promotions       enable row level security;
alter table public.ads              enable row level security;

-- Sites, domains, industries: public read, admin write
create policy sites_read on public.sites for select using (true);
create policy sites_admin_update on public.sites for update to authenticated
  using (public.is_site_staff(id, 'admin')) with check (public.is_site_staff(id, 'admin'));

create policy site_domains_read on public.site_domains for select using (true);

create policy industries_read on public.industries for select using (true);
create policy industries_admin_write on public.industries for all to authenticated
  using (public.is_site_staff(site_id, 'admin')) with check (public.is_site_staff(site_id, 'admin'));

-- Profiles: yourself, your teammates, and staff
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_employer_with(id) or public.is_any_site_staff());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and email = (select p.email from public.profiles p where p.id = (select auth.uid())));

-- Staff roster
create policy site_staff_read on public.site_staff for select to authenticated
  using (user_id = (select auth.uid()) or public.is_site_staff(site_id));
create policy site_staff_admin_write on public.site_staff for all to authenticated
  using (public.is_site_staff(site_id, 'admin')) with check (public.is_site_staff(site_id, 'admin'));

-- Employers
create policy employers_read on public.employers for select
  using (
    status = 'approved'
    or public.has_employer_role(id)
    or public.is_site_staff(site_id)
  );
create policy employers_staff_insert on public.employers for insert to authenticated
  with check (public.is_site_staff(site_id));
create policy employers_update on public.employers for update to authenticated
  using (public.has_employer_role(id, array['owner', 'admin']::public.member_role[]) or public.is_site_staff(site_id))
  with check (public.has_employer_role(id, array['owner', 'admin']::public.member_role[]) or public.is_site_staff(site_id));
create policy employers_admin_delete on public.employers for delete to authenticated
  using (public.is_site_staff(site_id, 'admin'));

-- Team membership: read for teammates/staff; changes go through RPCs (or site admins)
create policy employer_members_read on public.employer_members for select to authenticated
  using (public.has_employer_role(employer_id) or public.is_site_staff(public.employer_site_id(employer_id)));
create policy employer_members_admin_write on public.employer_members for all to authenticated
  using (public.is_site_staff(public.employer_site_id(employer_id), 'admin'))
  with check (public.is_site_staff(public.employer_site_id(employer_id), 'admin'));

-- Invites: managers of the business, the invitee, staff. Created/answered through RPCs.
create policy employer_invites_read on public.employer_invites for select to authenticated
  using (
    public.has_employer_role(employer_id, array['owner', 'admin']::public.member_role[])
    or email = lower((select auth.jwt()) ->> 'email')
    or public.is_site_staff(public.employer_site_id(employer_id))
  );

-- Claims on unclaimed listings
create policy employer_claims_read on public.employer_claims for select to authenticated
  using (user_id = (select auth.uid()) or public.is_site_staff(public.employer_site_id(employer_id)));

-- Jobs
create policy jobs_read on public.jobs for select
  using (
    (status = 'active' and deleted_at is null and expires_at > now() and public.employer_is_approved(employer_id))
    or public.has_employer_role(employer_id)
    or public.is_site_staff(site_id)
  );
create policy jobs_insert on public.jobs for insert to authenticated
  with check (public.has_employer_role(employer_id) or public.is_site_staff(public.employer_site_id(employer_id)));
create policy jobs_update on public.jobs for update to authenticated
  using (public.has_employer_role(employer_id) or public.is_site_staff(site_id))
  with check (public.has_employer_role(employer_id) or public.is_site_staff(site_id));
create policy jobs_admin_delete on public.jobs for delete to authenticated
  using (public.is_site_staff(site_id, 'admin'));

-- Events
create policy events_read on public.events for select
  using (
    (status = 'approved' and deleted_at is null)
    or (employer_id is not null and public.has_employer_role(employer_id))
    or public.is_site_staff(site_id)
  );
create policy events_insert on public.events for insert to authenticated
  with check (
    (employer_id is not null and public.has_employer_role(employer_id))
    or public.is_site_staff(site_id)
  );
create policy events_update on public.events for update to authenticated
  using ((employer_id is not null and public.has_employer_role(employer_id)) or public.is_site_staff(site_id))
  with check ((employer_id is not null and public.has_employer_role(employer_id)) or public.is_site_staff(site_id));
create policy events_staff_delete on public.events for delete to authenticated
  using (public.is_site_staff(site_id));

-- Staff-only tables (public writes happen server-side with the service role)
create policy subscribers_staff on public.subscribers for all to authenticated
  using (public.is_site_staff(site_id)) with check (public.is_site_staff(site_id));
create policy contact_messages_staff on public.contact_messages for all to authenticated
  using (public.is_site_staff(site_id)) with check (public.is_site_staff(site_id));
create policy audit_log_staff_read on public.audit_log for select to authenticated
  using (public.is_site_staff(site_id));
create policy blocked_signups_staff on public.blocked_signups for all to authenticated
  using (site_id is null and public.is_any_site_staff() or public.is_site_staff(site_id))
  with check (public.is_site_staff(site_id));
create policy promotions_read on public.promotions for select to authenticated
  using ((employer_id is not null and public.has_employer_role(employer_id)) or public.is_site_staff(site_id));
create policy promotions_staff_write on public.promotions for all to authenticated
  using (public.is_site_staff(site_id, 'admin')) with check (public.is_site_staff(site_id, 'admin'));
-- action_tokens: no policies at all -> only service role / RPCs.

create policy ads_read on public.ads for select
  using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or public.is_site_staff(site_id)
  );
create policy ads_staff_write on public.ads for all to authenticated
  using (public.is_site_staff(site_id, 'admin')) with check (public.is_site_staff(site_id, 'admin'));

-- ---------------------------------------------------------------------------
-- Public listing view (runs with the caller's permissions)
-- ---------------------------------------------------------------------------
create view public.job_listings with (security_invoker = true) as
select
  j.id, j.site_id, j.employer_id, j.title, j.job_type, j.industry, j.location,
  j.pay_min, j.pay_max, j.pay_period, j.published_at, j.bumped_at, j.expires_at,
  (j.featured_until is not null and j.featured_until > now()) as is_featured,
  e.name as employer_name, e.logo_path as employer_logo_path
from public.jobs j
join public.employers e on e.id = j.employer_id
where j.status = 'active'
  and j.deleted_at is null
  and j.expires_at > now()
  and e.status = 'approved';

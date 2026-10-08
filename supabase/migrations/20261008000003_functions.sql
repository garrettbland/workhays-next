-- RPCs: every multi-step or permission-sensitive action goes through one of these.
-- All are SECURITY DEFINER with an empty search_path and do their own permission checks.

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------
create or replace function public._hash_token(p_token text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex')
$$;

create or replace function public._new_token() returns text
language sql volatile set search_path = '' as $$
  select encode(extensions.gen_random_bytes(24), 'hex')
$$;

create or replace function public._require_user() returns uuid
language plpgsql stable set search_path = '' as $$
declare v uuid := (select auth.uid());
begin
  if v is null then
    raise exception 'You need to be signed in' using errcode = '42501';
  end if;
  return v;
end $$;

create or replace function public._renew_job(p_job_id uuid) returns public.jobs
language plpgsql security definer set search_path = '' as $$
declare v public.jobs;
begin
  update public.jobs j set
    status = 'active',
    bumped_at = now(),
    published_at = coalesce(j.published_at, now()),
    expires_at = now() + make_interval(days => public.site_setting_int(j.site_id, 'posting_days', 30)),
    expiry_reminder_sent_at = null,
    closed_at = null
  where j.id = p_job_id
    and j.deleted_at is null
    and j.status in ('active', 'expired')
    and public.employer_is_approved(j.employer_id)
  returning * into v;
  if v.id is null then
    raise exception 'This job can''t be renewed (it may be closed, deleted, or the business isn''t approved)';
  end if;
  return v;
end $$;

revoke execute on function public._renew_job(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Employers
-- ---------------------------------------------------------------------------

-- Create a business. It starts pending until a moderator approves it; the caller becomes owner.
create or replace function public.create_employer(p_site_id uuid, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := public._require_user();
  v_email text := lower((select auth.jwt()) ->> 'email');
  v_id uuid;
begin
  if exists (
    select 1 from public.blocked_signups b
    where (b.site_id is null or b.site_id = p_site_id)
      and ((b.kind = 'email' and b.value = v_email)
        or (b.kind = 'domain' and b.value = split_part(v_email, '@', 2)))
  ) then
    raise exception 'This account can''t create a business' using errcode = '42501';
  end if;
  if (select count(*) from public.employer_members m join public.employers e on e.id = m.employer_id
      where m.user_id = v_user and e.status = 'pending') >= 3 then
    raise exception 'You already have businesses waiting for approval';
  end if;

  insert into public.employers (site_id, name, status, created_by, email)
  values (p_site_id, trim(p_name), 'pending', v_user, v_email)
  returning id into v_id;

  insert into public.employer_members (employer_id, user_id, role, added_by)
  values (v_id, v_user, 'owner', v_user);

  perform public.log_audit(p_site_id, 'employer.created', 'employer', v_id, jsonb_build_object('name', p_name));
  return v_id;
end $$;

create or replace function public.claim_employer(p_employer_id uuid, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := public._require_user();
  v_id uuid;
begin
  if not exists (select 1 from public.employers where id = p_employer_id and is_claimable) then
    raise exception 'This business listing can''t be claimed';
  end if;
  insert into public.employer_claims (employer_id, user_id, message)
  values (p_employer_id, v_user, p_message)
  on conflict do nothing
  returning id into v_id;
  perform public.log_audit(public.employer_site_id(p_employer_id), 'employer.claim_requested', 'employer', p_employer_id);
  return v_id;
end $$;

create or replace function public.review_employer(p_employer_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_site uuid := public.employer_site_id(p_employer_id);
begin
  if not public.is_site_staff(v_site) then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  update public.employers set
    status = case when p_approve then 'approved'::public.employer_status else 'denied'::public.employer_status end,
    status_reason = p_reason,
    reviewed_by = (select auth.uid()),
    reviewed_at = now()
  where id = p_employer_id;
  perform public.log_audit(v_site, case when p_approve then 'employer.approved' else 'employer.denied' end,
    'employer', p_employer_id, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.set_employer_status(p_employer_id uuid, p_status public.employer_status, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_site uuid := public.employer_site_id(p_employer_id);
begin
  if not public.is_site_staff(v_site) then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  update public.employers set status = p_status, status_reason = p_reason,
    reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_employer_id;
  perform public.log_audit(v_site, 'employer.status_changed', 'employer', p_employer_id,
    jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

create or replace function public.review_employer_claim(p_claim_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.employer_claims;
begin
  select * into c from public.employer_claims where id = p_claim_id and status = 'pending';
  if c.id is null then raise exception 'Claim not found'; end if;
  if not public.is_site_staff(public.employer_site_id(c.employer_id)) then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  update public.employer_claims set
    status = case when p_approve then 'approved'::public.review_status else 'rejected'::public.review_status end,
    reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_claim_id;

  if p_approve then
    delete from public.employer_members where employer_id = c.employer_id and role = 'owner';
    insert into public.employer_members (employer_id, user_id, role, added_by)
    values (c.employer_id, c.user_id, 'owner', (select auth.uid()))
    on conflict (employer_id, user_id) do update set role = 'owner';
    update public.employers set is_claimable = false, status = 'approved' where id = c.employer_id;
    update public.employer_claims set status = 'rejected', reviewed_by = (select auth.uid()), reviewed_at = now()
      where employer_id = c.employer_id and status = 'pending';
  end if;
  perform public.log_audit(public.employer_site_id(c.employer_id),
    case when p_approve then 'employer.claim_approved' else 'employer.claim_rejected' end,
    'employer', c.employer_id, jsonb_build_object('user_id', c.user_id));
end $$;

-- ---------------------------------------------------------------------------
-- Teams: invites, acceptance, roles, removal
-- ---------------------------------------------------------------------------

-- Returns the raw token to put in the invite email. Only the owner can invite admins.
create or replace function public.create_employer_invite(p_employer_id uuid, p_email text, p_role public.member_role default 'member')
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := public._require_user();
  v_email text := lower(trim(p_email));
  v_token text := public._new_token();
  v_caller public.member_role;
begin
  select role into v_caller from public.employer_members where employer_id = p_employer_id and user_id = v_user;
  if v_caller is null or v_caller = 'member' then
    raise exception 'Only owners and admins can invite people' using errcode = '42501';
  end if;
  if p_role = 'owner' then
    raise exception 'Use transfer ownership instead';
  end if;
  if p_role = 'admin' and v_caller <> 'owner' then
    raise exception 'Only the owner can invite admins' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'That email address doesn''t look right';
  end if;
  if exists (select 1 from public.employer_members m join public.profiles p on p.id = m.user_id
             where m.employer_id = p_employer_id and lower(p.email) = v_email) then
    raise exception 'That person is already on this team';
  end if;

  -- Re-inviting replaces any outstanding invite (this is how "resend" works).
  update public.employer_invites set status = 'revoked', responded_at = now()
  where employer_id = p_employer_id and email = v_email and status = 'pending';

  insert into public.employer_invites (employer_id, email, role, token_hash, invited_by)
  values (p_employer_id, v_email, p_role, public._hash_token(v_token), v_user);

  perform public.log_audit(public.employer_site_id(p_employer_id), 'team.invited', 'employer', p_employer_id,
    jsonb_build_object('email', v_email, 'role', p_role));
  return v_token;
end $$;

-- What the invite acceptance page shows. Works signed out so the page can prompt sign-in/sign-up.
create or replace function public.get_employer_invite(p_token text)
returns table (
  invite_id uuid, employer_id uuid, employer_name text, employer_logo_path text,
  invited_by_name text, role public.member_role, email text, status public.invite_status, expires_at timestamptz
) language sql stable security definer set search_path = '' as $$
  select i.id, e.id, e.name, e.logo_path,
    nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
    i.role, i.email,
    case when i.status = 'pending' and i.expires_at < now() then 'expired'::public.invite_status else i.status end,
    i.expires_at
  from public.employer_invites i
  join public.employers e on e.id = i.employer_id
  left join public.profiles p on p.id = i.invited_by
  where i.token_hash = public._hash_token(p_token)
$$;

create or replace function public.respond_to_employer_invite(p_token text, p_accept boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := public._require_user();
  v_email text := lower((select auth.jwt()) ->> 'email');
  i public.employer_invites;
begin
  select * into i from public.employer_invites where token_hash = public._hash_token(p_token) for update;
  if i.id is null then raise exception 'Invite not found'; end if;
  if i.status <> 'pending' then raise exception 'This invite has already been %', i.status; end if;
  if i.expires_at < now() then
    update public.employer_invites set status = 'expired' where id = i.id;
    raise exception 'This invite has expired. Ask for a new one.';
  end if;
  if v_email is distinct from i.email then
    raise exception 'This invite was sent to %. Sign in with that email to respond.', i.email
      using errcode = '42501';
  end if;

  update public.employer_invites
  set status = case when p_accept then 'accepted'::public.invite_status else 'declined'::public.invite_status end,
      responded_at = now()
  where id = i.id;

  if p_accept then
    insert into public.employer_members (employer_id, user_id, role, added_by)
    values (i.employer_id, v_user, i.role, i.invited_by)
    on conflict (employer_id, user_id) do nothing;
  end if;

  perform public.log_audit(public.employer_site_id(i.employer_id),
    case when p_accept then 'team.invite_accepted' else 'team.invite_declined' end,
    'employer', i.employer_id, jsonb_build_object('email', i.email));
  return i.employer_id;
end $$;

create or replace function public.revoke_employer_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare i public.employer_invites;
begin
  select * into i from public.employer_invites where id = p_invite_id;
  if i.id is null or not public.has_employer_role(i.employer_id, array['owner', 'admin']::public.member_role[]) then
    raise exception 'Invite not found' using errcode = '42501';
  end if;
  update public.employer_invites set status = 'revoked', responded_at = now()
  where id = p_invite_id and status = 'pending';
  perform public.log_audit(public.employer_site_id(i.employer_id), 'team.invite_revoked', 'employer', i.employer_id,
    jsonb_build_object('email', i.email));
end $$;

-- Owner can remove anyone but themselves; admins can remove members; anyone but the owner can leave.
create or replace function public.remove_employer_member(p_employer_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := public._require_user();
  v_caller public.member_role;
  v_target public.member_role;
begin
  select role into v_caller from public.employer_members where employer_id = p_employer_id and user_id = v_user;
  select role into v_target from public.employer_members where employer_id = p_employer_id and user_id = p_user_id;
  if v_target is null then raise exception 'That person isn''t on this team'; end if;
  if v_target = 'owner' then
    raise exception 'The owner can''t be removed. Transfer ownership first.';
  end if;
  if p_user_id <> v_user and not (
       v_caller = 'owner'
    or (v_caller = 'admin' and v_target = 'member')
    or public.is_site_staff(public.employer_site_id(p_employer_id), 'admin')
  ) then
    raise exception 'You don''t have permission to remove this person' using errcode = '42501';
  end if;

  delete from public.employer_members where employer_id = p_employer_id and user_id = p_user_id;
  perform public.log_audit(public.employer_site_id(p_employer_id),
    case when p_user_id = v_user then 'team.left' else 'team.removed' end,
    'employer', p_employer_id, jsonb_build_object('user_id', p_user_id, 'role', v_target));
end $$;

create or replace function public.set_employer_member_role(p_employer_id uuid, p_user_id uuid, p_role public.member_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_employer_role(p_employer_id, array['owner']::public.member_role[]) then
    raise exception 'Only the owner can change roles' using errcode = '42501';
  end if;
  if p_role = 'owner' then raise exception 'Use transfer ownership instead'; end if;
  update public.employer_members set role = p_role
  where employer_id = p_employer_id and user_id = p_user_id and role <> 'owner';
  if not found then raise exception 'That person isn''t on this team'; end if;
  perform public.log_audit(public.employer_site_id(p_employer_id), 'team.role_changed', 'employer', p_employer_id,
    jsonb_build_object('user_id', p_user_id, 'role', p_role));
end $$;

create or replace function public.transfer_employer_ownership(p_employer_id uuid, p_new_owner_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := public._require_user();
begin
  if not public.has_employer_role(p_employer_id, array['owner']::public.member_role[]) then
    raise exception 'Only the owner can transfer ownership' using errcode = '42501';
  end if;
  if not exists (select 1 from public.employer_members where employer_id = p_employer_id and user_id = p_new_owner_id) then
    raise exception 'The new owner must already be on the team';
  end if;
  update public.employer_members set role = 'admin' where employer_id = p_employer_id and user_id = v_user;
  update public.employer_members set role = 'owner' where employer_id = p_employer_id and user_id = p_new_owner_id;
  perform public.log_audit(public.employer_site_id(p_employer_id), 'team.ownership_transferred', 'employer', p_employer_id,
    jsonb_build_object('from', v_user, 'to', p_new_owner_id));
end $$;

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create or replace function public.renew_job(p_job_id uuid) returns public.jobs
language plpgsql security definer set search_path = '' as $$
declare v_employer uuid;
begin
  select employer_id into v_employer from public.jobs where id = p_job_id;
  if v_employer is null or not (public.has_employer_role(v_employer)
     or public.is_site_staff(public.employer_site_id(v_employer))) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  return public._renew_job(p_job_id);
end $$;

create or replace function public.renew_jobs(p_job_ids uuid[]) returns int
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_count int := 0;
begin
  foreach v_id in array p_job_ids loop
    begin
      perform public.renew_job(v_id);
      v_count := v_count + 1;
    exception when others then
      null; -- skip jobs that can't be renewed
    end;
  end loop;
  return v_count;
end $$;

create or replace function public.close_job(p_job_id uuid, p_status public.job_status default 'filled')
returns void language plpgsql security definer set search_path = '' as $$
declare v_employer uuid;
begin
  if p_status not in ('filled', 'archived') then raise exception 'Invalid status'; end if;
  select employer_id into v_employer from public.jobs where id = p_job_id;
  if v_employer is null or not (public.has_employer_role(v_employer)
     or public.is_site_staff(public.employer_site_id(v_employer))) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  update public.jobs set status = p_status, updated_by = (select auth.uid()) where id = p_job_id;
end $$;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create or replace function public.review_event(p_event_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_site uuid;
begin
  select site_id into v_site from public.events where id = p_event_id;
  if v_site is null or not public.is_site_staff(v_site) then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  update public.events set
    status = case when p_approve then 'approved'::public.review_status else 'rejected'::public.review_status end,
    review_note = p_note, reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_event_id;
  perform public.log_audit(v_site, case when p_approve then 'event.approved' else 'event.rejected' end,
    'event', p_event_id, jsonb_build_object('note', p_note));
end $$;

-- ---------------------------------------------------------------------------
-- One-click email links (no login)
-- ---------------------------------------------------------------------------

-- Server only: mint a token for an email link. Returns the raw token.
create or replace function public.create_action_token(
  p_purpose public.action_purpose, p_target_id uuid, p_ttl interval default interval '7 days'
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_token text := public._new_token();
  v_site uuid;
begin
  if p_purpose in ('job_renew', 'job_close', 'job_confirm_auto_renew') then
    select site_id into v_site from public.jobs where id = p_target_id;
  else
    select site_id into v_site from public.subscribers where id = p_target_id;
  end if;
  if v_site is null then raise exception 'Target not found'; end if;
  insert into public.action_tokens (site_id, token_hash, purpose, target_id, expires_at)
  values (v_site, public._hash_token(v_token), p_purpose, p_target_id,
          case when p_purpose = 'subscriber_unsubscribe' then now() + interval '10 years' else now() + p_ttl end);
  return v_token;
end $$;

-- Read-only lookup for the confirmation page (GET must never perform the action:
-- email security scanners open every link).
create or replace function public.get_action_token(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'purpose', t.purpose,
    'state', case when t.used_at is not null and t.purpose <> 'subscriber_unsubscribe' then 'used'
                  when t.expires_at < now() then 'expired' else 'valid' end,
    'job', (select jsonb_build_object('title', j.title, 'employer_name', e.name, 'status', j.status,
                                      'expires_at', j.expires_at, 'auto_renew', j.auto_renew)
            from public.jobs j join public.employers e on e.id = j.employer_id
            where j.id = t.target_id and t.purpose in ('job_renew', 'job_close', 'job_confirm_auto_renew')),
    'email', (select s.email from public.subscribers s
              where s.id = t.target_id and t.purpose in ('subscriber_confirm', 'subscriber_unsubscribe'))
  )
  from public.action_tokens t
  where t.token_hash = public._hash_token(p_token)
$$;

-- Performs the action (called from the confirmation page's POST).
create or replace function public.use_action_token(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  t public.action_tokens;
  v_job public.jobs;
begin
  select * into t from public.action_tokens where token_hash = public._hash_token(p_token) for update;
  if t.id is null then raise exception 'This link isn''t valid'; end if;
  if t.expires_at < now() then raise exception 'This link has expired'; end if;
  if t.used_at is not null and t.purpose <> 'subscriber_unsubscribe' then
    raise exception 'This link has already been used';
  end if;

  case t.purpose
    when 'job_renew' then
      v_job := public._renew_job(t.target_id);
    when 'job_close' then
      update public.jobs set status = 'filled' where id = t.target_id and deleted_at is null
      returning * into v_job;
    when 'job_confirm_auto_renew' then
      update public.jobs set auto_renew_confirmed_at = now(), auto_renew_check_sent_at = null
      where id = t.target_id and auto_renew and deleted_at is null
      returning * into v_job;
      if v_job.id is null then raise exception 'Auto-renew is no longer on for this job'; end if;
    when 'subscriber_confirm' then
      update public.subscribers set status = 'confirmed', confirmed_at = now(), unsubscribed_at = null
      where id = t.target_id;
    when 'subscriber_unsubscribe' then
      update public.subscribers set status = 'unsubscribed', unsubscribed_at = coalesce(unsubscribed_at, now())
      where id = t.target_id;
  end case;

  update public.action_tokens set used_at = coalesce(used_at, now()) where id = t.id;
  perform public.log_audit(t.site_id, 'link.' || t.purpose::text, 'job', t.target_id);

  return jsonb_build_object('purpose', t.purpose, 'job_id', v_job.id, 'status', v_job.status, 'expires_at', v_job.expires_at);
end $$;

-- ---------------------------------------------------------------------------
-- Daily maintenance (called by the cron route with the service role)
-- ---------------------------------------------------------------------------
create or replace function public.run_job_maintenance() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_disabled int; v_renewed int; v_expired int; v_invites int;
begin
  -- 1. Auto-renew turns off if a "still hiring?" check went unanswered past the grace period.
  update public.jobs j set auto_renew = false
  where j.auto_renew and j.deleted_at is null
    and j.auto_renew_check_sent_at is not null
    and j.auto_renew_check_sent_at < now() - make_interval(days => public.site_setting_int(j.site_id, 'auto_renew_grace_days', 7))
    and (j.auto_renew_confirmed_at is null or j.auto_renew_confirmed_at < j.auto_renew_check_sent_at);
  get diagnostics v_disabled = row_count;

  -- 2. Auto-renew extends expiry WITHOUT bumping position.
  update public.jobs j set
    expires_at = greatest(j.expires_at, now()) + make_interval(days => public.site_setting_int(j.site_id, 'posting_days', 30)),
    expiry_reminder_sent_at = null
  where j.status = 'active' and j.auto_renew and j.deleted_at is null
    and j.expires_at <= now() + interval '1 day'
    and public.employer_is_approved(j.employer_id);
  get diagnostics v_renewed = row_count;

  -- 3. Expire everything else past its date.
  update public.jobs set status = 'expired'
  where status = 'active' and expires_at <= now();
  get diagnostics v_expired = row_count;

  -- 4. Stale invites.
  update public.employer_invites set status = 'expired'
  where status = 'pending' and expires_at < now();
  get diagnostics v_invites = row_count;

  return jsonb_build_object('auto_renew_disabled', v_disabled, 'auto_renewed', v_renewed,
                            'expired', v_expired, 'invites_expired', v_invites);
end $$;

-- Jobs whose owners should get the "expiring soon" email.
create or replace function public.jobs_due_for_expiry_reminder(p_site_id uuid)
returns setof public.jobs language sql stable security definer set search_path = '' as $$
  select j.* from public.jobs j
  where j.site_id = p_site_id and j.status = 'active' and not j.auto_renew and j.deleted_at is null
    and j.expiry_reminder_sent_at is null
    and j.expires_at <= now() + make_interval(days => public.site_setting_int(p_site_id, 'reminder_days_before', 3))
$$;

-- Auto-renewing jobs that are due for a "still hiring?" confirmation.
create or replace function public.jobs_due_for_auto_renew_check(p_site_id uuid)
returns setof public.jobs language sql stable security definer set search_path = '' as $$
  select j.* from public.jobs j
  where j.site_id = p_site_id and j.status = 'active' and j.auto_renew and j.deleted_at is null
    and j.auto_renew_check_sent_at is null
    and coalesce(j.auto_renew_confirmed_at, j.published_at) <=
        now() - make_interval(days => public.site_setting_int(p_site_id, 'auto_renew_confirm_days', 60))
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function public._hash_token(text) from public, anon, authenticated;
revoke execute on function public._new_token() from public, anon, authenticated;
revoke execute on function public._require_user() from public, anon;

revoke execute on function public.create_action_token(public.action_purpose, uuid, interval) from public, anon, authenticated;
revoke execute on function public.run_job_maintenance() from public, anon, authenticated;
revoke execute on function public.jobs_due_for_expiry_reminder(uuid) from public, anon, authenticated;
revoke execute on function public.jobs_due_for_auto_renew_check(uuid) from public, anon, authenticated;
grant execute on function public.create_action_token(public.action_purpose, uuid, interval) to service_role;
grant execute on function public.run_job_maintenance() to service_role;
grant execute on function public.jobs_due_for_expiry_reminder(uuid) to service_role;
grant execute on function public.jobs_due_for_auto_renew_check(uuid) to service_role;

-- Signed-in only
revoke execute on function public.create_employer(uuid, text) from public, anon;
revoke execute on function public.claim_employer(uuid, text) from public, anon;
revoke execute on function public.review_employer(uuid, boolean, text) from public, anon;
revoke execute on function public.set_employer_status(uuid, public.employer_status, text) from public, anon;
revoke execute on function public.review_employer_claim(uuid, boolean) from public, anon;
revoke execute on function public.create_employer_invite(uuid, text, public.member_role) from public, anon;
revoke execute on function public.respond_to_employer_invite(text, boolean) from public, anon;
revoke execute on function public.revoke_employer_invite(uuid) from public, anon;
revoke execute on function public.remove_employer_member(uuid, uuid) from public, anon;
revoke execute on function public.set_employer_member_role(uuid, uuid, public.member_role) from public, anon;
revoke execute on function public.transfer_employer_ownership(uuid, uuid) from public, anon;
revoke execute on function public.renew_job(uuid) from public, anon;
revoke execute on function public.renew_jobs(uuid[]) from public, anon;
revoke execute on function public.close_job(uuid, public.job_status) from public, anon;
revoke execute on function public.review_event(uuid, boolean, text) from public, anon;
-- get_employer_invite, get_action_token, use_action_token stay callable signed out (the token is the credential).

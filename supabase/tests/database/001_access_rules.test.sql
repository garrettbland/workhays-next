-- Run with `supabase test db` (pgTAP). Everything happens inside a transaction and is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(56);

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create table tests.user_emails (id uuid primary key, email text);
grant select on tests.user_emails to anon, authenticated, service_role;

create or replace function tests.create_user(p_id uuid, p_email text, p_first text) returns void
language sql as $$
  insert into tests.user_emails values (p_id, p_email);
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email, '',
          now(), '{"provider":"email"}', jsonb_build_object('first_name', p_first), now(), now())
$$;

create or replace function tests.as_user(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_id, 'role', 'authenticated',
    'email', (select email from tests.user_emails where id = p_id))::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

create or replace function tests.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform set_config('role', 'service_role', true);
end $$;

create or replace function tests.as_super() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Scratch space for values passed between steps
create table tests.vars (k text primary key, v text);
grant all on tests.vars to anon, authenticated, service_role;

select tests.create_user('a0000000-0000-4000-8000-00000000000a', 'alice@example.com', 'Alice');
select tests.create_user('b0000000-0000-4000-8000-00000000000b', 'bob@example.com', 'Bob');
select tests.create_user('c0000000-0000-4000-8000-00000000000c', 'carol@example.com', 'Carol');
select tests.create_user('d0000000-0000-4000-8000-00000000000d', 'mallory@example.com', 'Mallory');
select tests.create_user('e0000000-0000-4000-8000-00000000000e', 'mod@example.com', 'Mod');
insert into public.site_staff (site_id, user_id, role)
values ('00000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-00000000000e', 'moderator');

select is((select count(*)::int from public.profiles), 5, 'profiles are created from auth users');

-- ---------------------------------------------------------------------------
-- Employer sign-up and approval
-- ---------------------------------------------------------------------------
select tests.as_user('a0000000-0000-4000-8000-00000000000a');
insert into tests.vars values ('emp', public.create_employer('00000000-0000-4000-8000-000000000001', 'Alice''s Bakery'));
select is((select status::text from public.employers where id = (select v::uuid from tests.vars where k = 'emp')),
  'pending', 'new business starts pending');
select is((select role::text from public.employer_members where user_id = 'a0000000-0000-4000-8000-00000000000a'),
  'owner', 'creator becomes owner');

select throws_ok(
  $$update public.employers set status = 'approved' where id = (select v::uuid from tests.vars where k = 'emp')$$,
  '42501', null, 'owner cannot approve their own business');

insert into public.jobs (employer_id, title, status)
values ((select v::uuid from tests.vars where k = 'emp'), 'Baker', 'draft');
insert into tests.vars select 'job', id::text from public.jobs where title = 'Baker';
select pass('owner can create a draft job while pending');

select throws_ok(
  $$update public.jobs set status = 'active' where id = (select v::uuid from tests.vars where k = 'job')$$,
  '42501', null, 'cannot publish before the business is approved');

select tests.as_anon();
select is((select count(*)::int from public.employers), 0, 'anon cannot see a pending business');

select tests.as_user('d0000000-0000-4000-8000-00000000000d');
select is((select count(*)::int from public.employers), 0, 'outsider cannot see a pending business');
select is((select count(*)::int from public.jobs), 0, 'outsider cannot see draft jobs');
update public.employers set name = 'Hacked' where id = (select v::uuid from tests.vars where k = 'emp');
select tests.as_super();
select is((select name from public.employers where id = (select v::uuid from tests.vars where k = 'emp')),
  'Alice''s Bakery', 'outsider cannot edit a business');

select tests.as_user('d0000000-0000-4000-8000-00000000000d');
select throws_ok(
  $$select public.review_employer((select v::uuid from tests.vars where k = 'emp'), true)$$,
  '42501', null, 'non-staff cannot approve');
select throws_ok(
  $$insert into public.employer_members (employer_id, user_id, role)
    values ((select v::uuid from tests.vars where k = 'emp'), 'd0000000-0000-4000-8000-00000000000d', 'owner')$$,
  '42501', null, 'outsider cannot add themselves to a team');

select tests.as_user('e0000000-0000-4000-8000-00000000000e');
select lives_ok(
  $$select public.review_employer((select v::uuid from tests.vars where k = 'emp'), true)$$,
  'moderator approves the business');

select tests.as_anon();
select is((select count(*)::int from public.employers), 1, 'anon sees the approved business');

-- ---------------------------------------------------------------------------
-- Publishing jobs
-- ---------------------------------------------------------------------------
select tests.as_user('a0000000-0000-4000-8000-00000000000a');
update public.jobs set status = 'active', featured_until = now() + interval '1 year',
  expires_at = now() + interval '10 years'
where id = (select v::uuid from tests.vars where k = 'job');
select tests.as_super();
select ok((select expires_at between now() + interval '29 days' and now() + interval '31 days'
           from public.jobs where id = (select v::uuid from tests.vars where k = 'job')),
  'publishing sets a 30 day expiry (ignores client value)');
select is((select featured_until from public.jobs where id = (select v::uuid from tests.vars where k = 'job')),
  null, 'employers cannot make their own job featured');
select isnt((select bumped_at from public.jobs where id = (select v::uuid from tests.vars where k = 'job')),
  null, 'publishing sets the sort position');

select tests.as_anon();
select is((select count(*)::int from public.job_listings), 1, 'anon sees the live job in listings');
select is((select employer_name from public.job_listings), 'Alice''s Bakery', 'listing includes employer name');

-- ---------------------------------------------------------------------------
-- Team invites, acceptance, roles, removal
-- ---------------------------------------------------------------------------
select tests.as_user('a0000000-0000-4000-8000-00000000000a');
insert into tests.vars values ('inv_bob',
  public.create_employer_invite((select v::uuid from tests.vars where k = 'emp'), 'Bob@Example.com', 'admin'));

select tests.as_anon();
select is((select employer_name from public.get_employer_invite((select v from tests.vars where k = 'inv_bob'))),
  'Alice''s Bakery', 'invite page works signed out');
select is((select invited_by_name from public.get_employer_invite((select v from tests.vars where k = 'inv_bob'))),
  'Alice', 'invite page shows who invited them');
select is((select count(*)::int from public.get_employer_invite('not-a-real-token')), 0, 'bad token finds nothing');

select tests.as_user('d0000000-0000-4000-8000-00000000000d');
select throws_ok(
  $$select public.respond_to_employer_invite((select v from tests.vars where k = 'inv_bob'), true)$$,
  '42501', null, 'someone else cannot use the invite');

select tests.as_user('b0000000-0000-4000-8000-00000000000b');
select lives_ok(
  $$select public.respond_to_employer_invite((select v from tests.vars where k = 'inv_bob'), true)$$,
  'invitee accepts');
select is((select role::text from public.employer_members where user_id = 'b0000000-0000-4000-8000-00000000000b'),
  'admin', 'invitee joins with the invited role');
select throws_ok(
  $$select public.respond_to_employer_invite((select v from tests.vars where k = 'inv_bob'), true)$$,
  null, null, 'an invite can only be used once');
select is((select count(*)::int from public.jobs), 1, 'new teammate can see the business''s jobs');

-- Admin (Bob) can invite members but not admins
select throws_ok(
  $$select public.create_employer_invite((select v::uuid from tests.vars where k = 'emp'), 'carol@example.com', 'admin')$$,
  '42501', null, 'admins cannot invite admins');
insert into tests.vars values ('inv_carol',
  public.create_employer_invite((select v::uuid from tests.vars where k = 'emp'), 'carol@example.com', 'member'));

select tests.as_user('c0000000-0000-4000-8000-00000000000c');
select lives_ok(
  $$select public.respond_to_employer_invite((select v from tests.vars where k = 'inv_carol'), false)$$,
  'invitee can decline');
select is((select count(*)::int from public.employer_members where user_id = 'c0000000-0000-4000-8000-00000000000c'),
  0, 'declining does not add them');

select tests.as_user('b0000000-0000-4000-8000-00000000000b');
update tests.vars set v = public.create_employer_invite((select v::uuid from tests.vars where k = 'emp'), 'carol@example.com', 'member')
where k = 'inv_carol';
select tests.as_user('c0000000-0000-4000-8000-00000000000c');
select lives_ok($$select public.respond_to_employer_invite((select v from tests.vars where k = 'inv_carol'), true)$$,
  'a fresh invite can be accepted after declining');

select throws_ok(
  $$select public.remove_employer_member((select v::uuid from tests.vars where k = 'emp'), 'b0000000-0000-4000-8000-00000000000b')$$,
  '42501', null, 'members cannot remove admins');
select throws_ok(
  $$select public.create_employer_invite((select v::uuid from tests.vars where k = 'emp'), 'x@example.com', 'member')$$,
  '42501', null, 'members cannot invite');

select tests.as_user('b0000000-0000-4000-8000-00000000000b');
select throws_ok(
  $$select public.remove_employer_member((select v::uuid from tests.vars where k = 'emp'), 'a0000000-0000-4000-8000-00000000000a')$$,
  null, null, 'nobody can remove the owner');
select lives_ok(
  $$select public.remove_employer_member((select v::uuid from tests.vars where k = 'emp'), 'c0000000-0000-4000-8000-00000000000c')$$,
  'admins can remove members');

select tests.as_user('c0000000-0000-4000-8000-00000000000c');
select throws_ok(
  $$insert into public.jobs (employer_id, title) values ((select v::uuid from tests.vars where k = 'emp'), 'Sneaky')$$,
  '42501', null, 'removed member immediately loses access');

select tests.as_user('a0000000-0000-4000-8000-00000000000a');
select lives_ok(
  $$select public.transfer_employer_ownership((select v::uuid from tests.vars where k = 'emp'), 'b0000000-0000-4000-8000-00000000000b')$$,
  'owner can transfer ownership to a teammate');
select is((select role::text from public.employer_members where user_id = 'a0000000-0000-4000-8000-00000000000a'),
  'admin', 'previous owner becomes admin');
select lives_ok(
  $$select public.remove_employer_member((select v::uuid from tests.vars where k = 'emp'), 'a0000000-0000-4000-8000-00000000000a')$$,
  'non-owners can leave');

-- ---------------------------------------------------------------------------
-- One-click email links
-- ---------------------------------------------------------------------------
select tests.as_anon();
select throws_ok(
  $$select public.create_action_token('job_renew', (select v::uuid from tests.vars where k = 'job'))$$,
  '42501', null, 'anon cannot mint action links');

select tests.as_super();
update public.jobs set bumped_at = now() - interval '20 days', expires_at = now() + interval '2 days'
where id = (select v::uuid from tests.vars where k = 'job');
select tests.as_service();
insert into tests.vars values ('renew', public.create_action_token('job_renew', (select v::uuid from tests.vars where k = 'job')));

select tests.as_anon();
select is((select public.get_action_token((select v from tests.vars where k = 'renew')) ->> 'state'),
  'valid', 'renew link is valid');
select is((select public.get_action_token((select v from tests.vars where k = 'renew')) -> 'job' ->> 'title'),
  'Baker', 'confirmation page can show the job');
select lives_ok($$select public.use_action_token((select v from tests.vars where k = 'renew'))$$,
  'renew link works without logging in');
select throws_ok($$select public.use_action_token((select v from tests.vars where k = 'renew'))$$,
  null, null, 'renew link is single use');

select tests.as_super();
select ok((select bumped_at > now() - interval '1 minute' and expires_at > now() + interval '29 days'
           from public.jobs where id = (select v::uuid from tests.vars where k = 'job')),
  'renewing bumps to the top and extends 30 days');

-- ---------------------------------------------------------------------------
-- Daily maintenance: expiry and auto-renew
-- ---------------------------------------------------------------------------
update public.jobs set expires_at = now() - interval '1 hour' where id = (select v::uuid from tests.vars where k = 'job');
select tests.as_service();
select is((select (public.run_job_maintenance() ->> 'expired')::int), 1, 'maintenance expires overdue jobs');
select tests.as_anon();
select is((select count(*)::int from public.job_listings), 0, 'expired jobs leave the public list');

select tests.as_super();
update public.jobs set status = 'active', auto_renew = true, expires_at = now() + interval '1 hour',
  bumped_at = now() - interval '25 days'
where id = (select v::uuid from tests.vars where k = 'job');
select tests.as_service();
select is((select (public.run_job_maintenance() ->> 'auto_renewed')::int), 1, 'auto-renew extends jobs about to expire');
select tests.as_super();
select ok((select bumped_at < now() - interval '24 days' and expires_at > now() + interval '29 days'
           from public.jobs where id = (select v::uuid from tests.vars where k = 'job')),
  'auto-renew extends without bumping');

update public.jobs set auto_renew_check_sent_at = now() - interval '8 days',
  auto_renew_confirmed_at = now() - interval '70 days'
where id = (select v::uuid from tests.vars where k = 'job');
select tests.as_service();
select is((select (public.run_job_maintenance() ->> 'auto_renew_disabled')::int), 1,
  'auto-renew turns off when the still-hiring check is ignored');

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
select tests.as_service();
insert into public.events (site_id, title, starts_at, submitter_name, submitter_email, status)
values ('00000000-0000-4000-8000-000000000001', 'Community Job Fair', now() + interval '10 days',
        'Pat', 'pat@example.com', 'approved');
select tests.as_super();
select is((select status::text from public.events where title = 'Community Job Fair'), 'pending',
  'public submissions always start pending');

select tests.as_anon();
select is((select count(*)::int from public.events), 0, 'pending events are hidden');

select tests.as_user('b0000000-0000-4000-8000-00000000000b');
insert into public.events (site_id, employer_id, title, starts_at)
values ('00000000-0000-4000-8000-000000000001', (select v::uuid from tests.vars where k = 'emp'),
        'Bakery Open House', now() + interval '5 days');
select tests.as_super();
select is((select status::text from public.events where title = 'Bakery Open House'), 'approved',
  'approved businesses publish events directly');

select tests.as_user('e0000000-0000-4000-8000-00000000000e');
select lives_ok($$select public.review_event((select id from public.events where title = 'Community Job Fair'), true)$$,
  'moderator approves a public event');
select tests.as_anon();
select is((select count(*)::int from public.events), 2, 'approved events are public');

-- ---------------------------------------------------------------------------
-- Private tables
-- ---------------------------------------------------------------------------
select tests.as_anon();
select is((select count(*)::int from public.action_tokens), 0, 'anon cannot read action tokens');

select * from finish();
rollback;

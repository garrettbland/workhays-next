-- Contact-message conversations (admin inbox). Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

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

select tests.create_user('e0000000-0000-4000-8000-00000000000e', 'mod@example.com', 'Mod');
select tests.create_user('d0000000-0000-4000-8000-00000000000d', 'mallory@example.com', 'Mallory');
insert into public.site_staff (site_id, user_id, role)
values ('00000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-00000000000e', 'moderator');

insert into public.contact_messages (site_id, name, email, message)
values ('00000000-0000-4000-8000-000000000001', 'Pat', 'pat@example.com', 'How do I post a job?');
insert into tests.vars select 'msg', id::text from public.contact_messages where email = 'pat@example.com';

select ok((select reply_token ~ '^[0-9a-f]{24}$' from public.contact_messages where email = 'pat@example.com'),
  'each message gets a random reply token');

-- Incoming email is written by the server (service role)
select tests.as_service();
insert into public.contact_message_entries (message_id, site_id, direction, from_email, body_text, email_id)
values ((select v::uuid from tests.vars where k = 'msg'), '00000000-0000-4000-8000-000000000001', 'in', 'pat@example.com', 'Thanks!', 'resend-1');
select throws_ok(
  $$insert into public.contact_message_entries (message_id, site_id, direction, from_email, body_text, email_id)
    values ((select v::uuid from tests.vars where k = 'msg'), '00000000-0000-4000-8000-000000000001', 'in', 'pat@example.com', 'dup', 'resend-1')$$,
  '23505', null, 'the same received email cannot be stored twice');

-- Staff
select tests.as_user('e0000000-0000-4000-8000-00000000000e');
select is((select count(*)::int from public.contact_message_entries), 1, 'staff can read the conversation');
insert into public.contact_message_entries (message_id, site_id, direction, from_email, body_text, staff_user_id)
values ((select v::uuid from tests.vars where k = 'msg'), '00000000-0000-4000-8000-000000000001', 'out', 'hello@mail.workhays.com', 'Here is how.', 'e0000000-0000-4000-8000-00000000000e');
select pass('staff can add their own reply');
select throws_ok(
  $$insert into public.contact_message_entries (message_id, site_id, direction, from_email, body_text, staff_user_id)
    values ((select v::uuid from tests.vars where k = 'msg'), '00000000-0000-4000-8000-000000000001', 'in', 'pat@example.com', 'fake', 'e0000000-0000-4000-8000-00000000000e')$$,
  '42501', null, 'staff cannot fake an incoming email');
select throws_ok(
  $$insert into public.contact_message_entries (message_id, site_id, direction, from_email, body_text, staff_user_id)
    values ((select v::uuid from tests.vars where k = 'msg'), '00000000-0000-4000-8000-000000000001', 'out', 'x@example.com', 'as someone else', 'd0000000-0000-4000-8000-00000000000d')$$,
  '42501', null, 'staff cannot reply as someone else');
select is((select count(*)::int from public.inbound_auto_replies), 0, 'auto-reply log is not visible to staff');

-- Everyone else
select tests.as_user('d0000000-0000-4000-8000-00000000000d');
select is((select count(*)::int from public.contact_message_entries), 0, 'non-staff cannot read conversations');
select throws_ok(
  $$insert into public.contact_message_entries (message_id, site_id, direction, from_email, body_text, staff_user_id)
    values ((select v::uuid from tests.vars where k = 'msg'), '00000000-0000-4000-8000-000000000001', 'out', 'x@example.com', 'hi', 'd0000000-0000-4000-8000-00000000000d')$$,
  '42501', null, 'non-staff cannot reply');
select tests.as_anon();
select is((select count(*)::int from public.contact_message_entries), 0, 'anon cannot read conversations');

select * from finish();
rollback;

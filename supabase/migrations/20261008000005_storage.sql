-- Public bucket for employer logos/header images and event images.
-- Layout: employers/<employer_id>/<file>, events/<event_id>/<file>, legacy/<file> (migrated uploads)
-- Guarded so the schema can also be applied to plain Postgres in tests.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'storage schema not present; skipping bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('public-assets', 'public-assets', true, 2097152,
          array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])
  on conflict (id) do nothing;

  execute $p$
    create policy "public assets are readable"
    on storage.objects for select
    using (bucket_id = 'public-assets')
  $p$;

  execute $p$
    create policy "team members upload employer images"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'public-assets'
      and (storage.foldername(name))[1] = 'employers'
      and public.has_employer_role(((storage.foldername(name))[2])::uuid, array['owner','admin']::public.member_role[])
    )
  $p$;

  execute $p$
    create policy "team members replace employer images"
    on storage.objects for update to authenticated
    using (
      bucket_id = 'public-assets'
      and (storage.foldername(name))[1] = 'employers'
      and public.has_employer_role(((storage.foldername(name))[2])::uuid, array['owner','admin']::public.member_role[])
    )
  $p$;

  execute $p$
    create policy "team members delete employer images"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'public-assets'
      and (storage.foldername(name))[1] = 'employers'
      and public.has_employer_role(((storage.foldername(name))[2])::uuid, array['owner','admin']::public.member_role[])
    )
  $p$;
end $$;

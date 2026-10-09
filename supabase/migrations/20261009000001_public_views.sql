-- Upcoming approved events (runs with the caller's permissions, so RLS still applies).
-- Kept in SQL so pages can be cached without reading the clock in app code.
create view public.upcoming_events with (security_invoker = true) as
select
  ev.id, ev.site_id, ev.employer_id, ev.title, ev.description_html, ev.starts_at, ev.ends_at, ev.all_day,
  ev.location_name, ev.address, ev.event_url, ev.image_path, ev.is_job_fair,
  e.name as employer_name
from public.events ev
left join public.employers e on e.id = ev.employer_id
where ev.status = 'approved'
  and ev.deleted_at is null
  and coalesce(ev.ends_at, ev.starts_at) >= now() - interval '12 hours';

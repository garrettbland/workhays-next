/**
 * Public, cacheable reads. Everything here uses the anonymous client, so results are exactly
 * what row-level security lets the public see. Each function is cached and tagged; dashboard
 * and admin mutations refresh them with revalidateTag/updateTag.
 */
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type JobListing = {
  id: string;
  title: string;
  job_type: string;
  industry: string | null;
  location: string | null;
  employer_id: string;
  employer_name: string;
  published_at: string;
  bumped_at: string;
  is_featured: boolean;
};

export type JobDetail = {
  id: string;
  title: string;
  description_html: string;
  job_type: string;
  industry: string | null;
  location: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_period: string | null;
  application_url: string | null;
  application_email: string | null;
  published_at: string;
  bumped_at: string;
  expires_at: string;
  employer: {
    id: string;
    name: string;
    website_url: string | null;
    logo_path: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type Employer = {
  id: string;
  name: string;
  description_html: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  logo_path: string | null;
  is_claimable: boolean;
};

export type EventListing = {
  id: string;
  title: string;
  description_html: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location_name: string | null;
  address: string | null;
  event_url: string | null;
  is_job_fair: boolean;
  employer_id: string | null;
  employer_name: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);

export async function getLiveJobs(siteId: string): Promise<JobListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs");
  const { data, error } = await createPublicClient()
    .from("job_listings")
    .select("id, title, job_type, industry, location, employer_id, employer_name, published_at, bumped_at, is_featured")
    .eq("site_id", siteId)
    .order("is_featured", { ascending: false })
    .order("bumped_at", { ascending: false });
  if (error) throw new Error(`Failed to load jobs: ${error.message}`);
  return data as JobListing[];
}

export async function getJob(id: string): Promise<JobDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs", `job:${id}`);
  if (!isUuid(id)) return null;
  const { data, error } = await createPublicClient()
    .from("jobs")
    .select(
      "id, title, description_html, job_type, industry, location, pay_min, pay_max, pay_period, application_url, application_email, published_at, bumped_at, expires_at, employer:employers!inner(id, name, website_url, logo_path, email, phone)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load job: ${error.message}`);
  return data as unknown as JobDetail | null;
}

export async function getIndustries(siteId: string): Promise<{ slug: string; name: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("industries");
  const { data, error } = await createPublicClient()
    .from("industries")
    .select("slug, name")
    .eq("site_id", siteId)
    .order("sort_order");
  if (error) throw new Error(`Failed to load industries: ${error.message}`);
  return data;
}

export async function getEmployers(siteId: string): Promise<{ id: string; name: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("employers");
  const { data, error } = await createPublicClient()
    .from("employers")
    .select("id, name")
    .eq("site_id", siteId)
    .order("name");
  if (error) throw new Error(`Failed to load employers: ${error.message}`);
  return data;
}

export async function getEmployer(id: string): Promise<Employer | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("employers", `employer:${id}`);
  if (!isUuid(id)) return null;
  const { data, error } = await createPublicClient()
    .from("employers")
    .select(
      "id, name, description_html, contact_name, email, phone, website_url, facebook_url, instagram_url, linkedin_url, x_url, youtube_url, logo_path, is_claimable",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load employer: ${error.message}`);
  return data as Employer | null;
}

export async function getUpcomingEvents(siteId: string): Promise<EventListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  const { data, error } = await createPublicClient()
    .from("upcoming_events")
    .select("id, title, description_html, starts_at, ends_at, all_day, location_name, address, event_url, is_job_fair, employer_id, employer_name")
    .eq("site_id", siteId)
    .order("starts_at");
  if (error) throw new Error(`Failed to load events: ${error.message}`);
  return data as EventListing[];
}

export type EventDetail = {
  id: string;
  title: string;
  description_html: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location_name: string | null;
  address: string | null;
  event_url: string | null;
  image_path: string | null;
  is_job_fair: boolean;
  employer: { id: string; name: string; logo_path: string | null } | null;
};

/** One approved event (past ones too, so shared links keep working). */
export async function getEvent(id: string): Promise<EventDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("events", `event:${id}`);
  if (!isUuid(id)) return null;
  const { data, error } = await createPublicClient()
    .from("events")
    .select(
      "id, title, description_html, starts_at, ends_at, all_day, location_name, address, event_url, image_path, is_job_fair, employer:employers(id, name, logo_path)",
    )
    .eq("id", id)
    .eq("status", "approved")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`Failed to load event: ${error.message}`);
  return data as unknown as EventDetail | null;
}

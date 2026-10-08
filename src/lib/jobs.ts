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
  employer_logo_path: string | null;
  bumped_at: string;
  is_featured: boolean;
};

/** Live jobs for a site, featured first then most recently posted/renewed. Cached; refreshed by tag "jobs". */
export async function getLiveJobs(siteId: string): Promise<JobListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs");

  const { data, error } = await createPublicClient()
    .from("job_listings")
    .select("id, title, job_type, industry, location, employer_id, employer_name, employer_logo_path, bumped_at, is_featured")
    .eq("site_id", siteId)
    .order("is_featured", { ascending: false })
    .order("bumped_at", { ascending: false });
  if (error) throw new Error(`Failed to load jobs: ${error.message}`);
  return data as JobListing[];
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

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  seasonal: "Seasonal",
  internship: "Internship",
};

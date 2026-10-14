import type { MetadataRoute } from "next";
import { getLiveJobs, getUpcomingEvents } from "@/lib/data";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, events] = await Promise.all([getLiveJobs(SITE.id), getUpcomingEvents(SITE.id)]);
  const employerIds = [...new Set(jobs.map((j) => j.employer_id))];
  const latest = jobs.reduce((max, j) => (j.bumped_at > max ? j.bumped_at : max), "1970-01-01T00:00:00Z");
  return [
    { url: `${SITE.url}/`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/employers`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE.url}/events`, changeFrequency: "weekly", priority: 0.5 },
    ...["about", "help", "privacy", "terms"].map((p) => ({ url: `${SITE.url}/${p}`, priority: 0.2 })),
    ...jobs.map((j) => ({ url: `${SITE.url}/jobs/${j.id}`, lastModified: j.bumped_at, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...events.map((e) => ({ url: `${SITE.url}/events/${e.id}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...employerIds.map((id) => ({ url: `${SITE.url}/employers/${id}`, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}

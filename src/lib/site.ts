import { publicEnv } from "@/lib/env";

export const SITE = {
  id: publicEnv.NEXT_PUBLIC_SITE_ID,
  url: publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
  name: "Work Hays",
  tagline: "Local jobs in Hays and western Kansas",
  timezone: "America/Chicago",
  // Default job location for Google for Jobs when a posting doesn't name one.
  defaultLocation: { locality: "Hays", region: "KS", country: "US" },
} as const;

/** Public URL for a file in the Supabase "public-assets" bucket. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`;
}

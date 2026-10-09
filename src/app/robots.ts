import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/invite", "/link"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

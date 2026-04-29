import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/url";

/**
 * Disallow private user-area paths and all API endpoints. The marketing
 * site root and legal pages are crawlable; the embeddable agent (/embed/*)
 * and the public agent page (/a/*) are owner-shared, not search-indexed.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/legal/"],
        disallow: ["/api/", "/business/", "/dashboard/", "/a/", "/embed/", "/agent/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

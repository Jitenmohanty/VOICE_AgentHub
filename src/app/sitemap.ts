import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`,                lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/login`,           lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/register`,        lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/privacy`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/legal/terms`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/legal/cookies`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
  return entries;
}

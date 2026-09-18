// Purpose: search-engine crawl rules for public vs authenticated ApplyFlow routes.
// Constraints: keep private application data out of indexes; allow login and SEO assets.
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login"],
      disallow: ["/dashboard", "/applications", "/settings", "/api/", "/auth/callback"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(),
  };
}

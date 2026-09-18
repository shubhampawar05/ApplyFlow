// Purpose: list indexable public pages for search engines.
// Constraints: only include routes that do not require authentication.
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/login"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

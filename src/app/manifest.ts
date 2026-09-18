// Purpose: web app manifest for browser install prompts and richer link metadata.
// Constraints: branding only; no authenticated routes as marketing landing pages.
import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#2f6c52",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

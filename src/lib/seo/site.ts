// Purpose: canonical site URL and shared branding constants for SEO metadata.
// Constraints: no secrets; safe to use from server metadata routes and client-visible env vars only.

export const siteName = "ApplyFlow";
export const siteTagline = "Thoughtful applications, in motion";
export const siteDescription =
  "Turn a job screenshot into a reviewable application draft with AI-assisted extraction, resume matching, and human-approved Gmail sending.";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

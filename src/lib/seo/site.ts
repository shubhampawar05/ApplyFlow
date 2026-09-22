// Purpose: canonical site URL and shared branding constants for SEO metadata.
// Constraints: no secrets; safe to use from server metadata routes and client-visible env vars only.

export const siteName = "ApplyFlow";
export const siteTagline = "Thoughtful applications, in motion";
export const siteDescription =
  "Turn a job screenshot into a reviewable application draft with AI-assisted extraction, resume matching, and human-approved Gmail sending.";

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const normalized = normalizeSiteUrl(configured);
    if (normalized) {
      return normalized;
    }
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

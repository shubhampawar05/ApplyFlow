export const DEFAULT_POST_LOGIN_PATH = "/dashboard";

export function isPublicAuthPath(pathname: string) {
  return pathname === "/login" || pathname === "/auth/callback" || pathname === "/auth/error";
}

export function isPublicPath(pathname: string) {
  return (
    isPublicAuthPath(pathname) ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/opengraph-image")
  );
}

export function safeNextPath(next: string | null | undefined, fallback = DEFAULT_POST_LOGIN_PATH) {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  if (next.startsWith("/login") || next.startsWith("/auth/")) return fallback;
  return next;
}

export function loginPathWithNext(next: string) {
  const safe = safeNextPath(next);
  if (safe === DEFAULT_POST_LOGIN_PATH) return "/login";
  return `/login?next=${encodeURIComponent(safe)}`;
}

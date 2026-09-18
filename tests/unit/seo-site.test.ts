import { afterEach, describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";

describe("getSiteUrl", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }

    if (originalVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = originalVercelUrl;
    }
  });

  it("prefers NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://applyflow.example.com/";
    expect(getSiteUrl()).toBe("https://applyflow.example.com");
  });

  it("falls back to VERCEL_URL when site URL is not configured", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "applyflow.vercel.app";
    expect(getSiteUrl()).toBe("https://applyflow.vercel.app");
  });

  it("builds absolute URLs from the configured site origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://applyflow.example.com";
    expect(absoluteUrl("/login")).toBe("https://applyflow.example.com/login");
  });
});

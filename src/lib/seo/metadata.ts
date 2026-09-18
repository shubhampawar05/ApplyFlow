// Purpose: shared Next.js Metadata builders for public and private app routes.
// Constraints: no user or application data in metadata; branding strings only.
import type { Metadata } from "next";
import { getSiteUrl, siteDescription, siteName, siteTagline } from "./site";

const defaultTitle = `${siteName} — ${siteTagline}`;

export const defaultSiteMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: defaultTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteDescription,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export function pageMetadata(title: string, description = siteDescription): Metadata {
  const pageTitle = `${title} — ${siteName}`;

  return {
    title,
    description,
    openGraph: {
      title: pageTitle,
      description,
    },
    twitter: {
      title: pageTitle,
      description,
    },
  };
}

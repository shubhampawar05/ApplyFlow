// Purpose: root HTML layout: app font, global styles, providers, and site metadata.
// Constraints: no data fetching or auth here; keep client providers in AppProviders.
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { defaultSiteMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = defaultSiteMetadata;

export const viewport: Viewport = {
  themeColor: "#2f6c52",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={inter.variable} lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

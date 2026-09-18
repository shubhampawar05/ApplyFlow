import type { Metadata, Viewport } from "next";
import { defaultSiteMetadata } from "@/lib/seo/metadata";
import "./globals.css";

export const metadata: Metadata = defaultSiteMetadata;

export const viewport: Viewport = {
  themeColor: "#2f6c52",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

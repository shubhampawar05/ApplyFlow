import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Applications",
};

export default function ApplicationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

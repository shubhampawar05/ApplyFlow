import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Dashboard",
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

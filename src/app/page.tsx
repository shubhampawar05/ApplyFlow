import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata;

export default function HomePage() {
  redirect("/dashboard");
}

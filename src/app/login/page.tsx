import type { Metadata } from "next";
import { GoogleSignInButton } from "./google-sign-in-button";
import { safeNextPath } from "@/features/auth/auth.paths";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...pageMetadata(
    "Sign in",
    "Sign in to ApplyFlow to review job applications, match your resume, and approve emails before anything is sent.",
  ),
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  return (
    <main className="auth-page">
      <section className="empty-card auth-card">
        <p className="eyebrow">ApplyFlow</p>
        <h1>Sign in to review applications before anything is sent.</h1>
        <p className="lede">
          Google sign-in is handled by Supabase Auth. ApplyFlow never stores Google client secrets in this app, and
          nothing is emailed without your explicit approval.
        </p>
        <GoogleSignInButton nextPath={nextPath} />
      </section>
    </main>
  );
}

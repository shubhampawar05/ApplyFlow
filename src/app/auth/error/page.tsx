import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...pageMetadata("Sign-in error", "ApplyFlow could not complete Google sign-in."),
  ...privatePageMetadata,
};

const messages: Record<string, string> = {
  "missing-code": "Google did not return a sign-in code. Please try again.",
  "exchange-failed": "We could not complete Google sign-in. Please try again.",
  "missing-email": "Google did not share an email address, which ApplyFlow needs to create your workspace.",
  oauth: "Google sign-in was cancelled or failed. You can try again when you are ready.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = messages[reason ?? ""] ?? "Something went wrong while signing in. Please try again.";

  return (
    <main className="auth-page">
      <section className="empty-card auth-card">
        <p className="eyebrow">Sign in</p>
        <h1>We could not finish Google sign-in.</h1>
        <p className="lede">{message}</p>
        <Link className="button" href="/login">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}

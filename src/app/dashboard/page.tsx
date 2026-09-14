import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";

export default async function DashboardPage() {
  const user = await requireCurrentUser("/dashboard");

  return (
    <AppShell activePath="/dashboard" userLabel={user.displayName ?? user.email}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Start with the opportunity in front of you.</h1>
          <p className="lede">
            Upload a job-posting screenshot. ApplyFlow will organize the details and help you prepare a thoughtful
            application—one you always review before sending.
          </p>
        </div>
        <Link className="button" href="/applications/new">
          New application
        </Link>
      </header>
      <section aria-labelledby="recent-applications">
        <p className="section-label" id="recent-applications">
          Recent applications
        </p>
        <div className="empty-card">
          <div className="empty-icon" aria-hidden="true">
            ⌁
          </div>
          <h2>Your application list is ready when you are.</h2>
          <p>
            Your first job screenshot becomes a draft you can check, refine, and choose to send. Nothing leaves
            ApplyFlow without your explicit approval.
          </p>
          <Link className="button" href="/applications/new">
            Add your first screenshot
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

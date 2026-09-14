import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listApplicationsForUser } from "@/features/applications/application.repository";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { ApplicationList } from "./application-list";

export default async function DashboardPage() {
  const user = await requireCurrentUser("/dashboard");
  const applications = await listApplicationsForUser(user.id);

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
        <ApplicationList applications={applications} />
      </section>
    </AppShell>
  );
}

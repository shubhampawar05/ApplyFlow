import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getDashboardSummaryForUser } from "@/features/applications/application-analytics.service";
import { applicationStatusSchema } from "@/features/applications/application.schemas";
import { listApplicationsForUser } from "@/features/applications/application.repository";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { ApplicationList } from "./application-list";
import { DashboardFilters } from "./dashboard-filters";
import { DashboardSummary } from "./dashboard-summary";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireCurrentUser("/dashboard");
  const params = await searchParams;
  const statusResult = params.status ? applicationStatusSchema.safeParse(params.status) : null;
  const status = statusResult?.success ? statusResult.data : undefined;
  const [applications, summary] = await Promise.all([
    listApplicationsForUser(user.id, { status }),
    getDashboardSummaryForUser(user.id),
  ]);

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

      <DashboardSummary summary={summary} />

      <section aria-labelledby="recent-applications">
        <p className="section-label" id="recent-applications">
          Recent applications
        </p>
        <DashboardFilters activeStatus={status} />
        <ApplicationList applications={applications} />
      </section>
    </AppShell>
  );
}

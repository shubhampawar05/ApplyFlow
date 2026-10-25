// Purpose: dashboard with summary, follow-ups due, and a searchable, sortable application list.
// Constraints: server component; every query scoped to the signed-in user; filter state lives in the URL.
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getDashboardSummaryForUser } from "@/features/applications/application-analytics.service";
import {
  listApplicationsForUser,
  listDueFollowUpsForUser,
} from "@/features/applications/application.repository";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { ApplicationList } from "./application-list";
import { dashboardHref, hasActiveFilters, parseDashboardQuery } from "./dashboard-query";
import { DashboardFilters } from "./dashboard-filters";
import { DashboardSearch } from "./dashboard-search";
import { DashboardSummary } from "./dashboard-summary";
import { FollowUpsDue } from "./follow-ups-due";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCurrentUser("/dashboard");
  const query = parseDashboardQuery(await searchParams);
  const now = new Date();
  const [applications, summary, dueFollowUps] = await Promise.all([
    listApplicationsForUser(user.id, {
      status: query.status,
      q: query.q,
      sort: query.sort,
      needsAction: query.view === "needs-action",
      now,
    }),
    getDashboardSummaryForUser(user.id),
    listDueFollowUpsForUser(user.id, now),
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

      <FollowUpsDue items={dueFollowUps} now={now} />

      <section aria-labelledby="recent-applications" className="dashboard-applications">
        <p className="section-label" id="recent-applications">
          Applications
        </p>
        <DashboardSearch query={query} />
        <DashboardFilters query={query} />
        <ApplicationList
          applications={applications}
          clearHref={dashboardHref({ sort: query.sort })}
          filtered={hasActiveFilters(query)}
          now={now}
        />
      </section>
    </AppShell>
  );
}

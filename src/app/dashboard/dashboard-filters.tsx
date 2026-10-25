// Purpose: status and needs-action filter chips for the dashboard list.
// Constraints: links only; keep search and sort when switching filters.
import Link from "next/link";
import { dashboardHref, type DashboardQuery } from "./dashboard-query";

const statusFilters = [
  { value: "DRAFT", label: "Draft" },
  { value: "ANALYZED", label: "Analyzed" },
  { value: "READY", label: "Ready" },
  { value: "SENT", label: "Sent" },
  { value: "FOLLOW_UP", label: "Follow up" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CLOSED", label: "Closed" },
] as const;

export function DashboardFilters({ query }: { query: DashboardQuery }) {
  const base = { q: query.q, sort: query.sort };
  const isAll = !query.status && !query.view;

  return (
    <nav aria-label="Filter applications" className="dashboard-filters">
      <Link aria-current={isAll ? "page" : undefined} className={`filter-chip ${isAll ? "active" : ""}`} href={dashboardHref(base)}>
        All
      </Link>
      <Link
        aria-current={query.view === "needs-action" ? "page" : undefined}
        className={`filter-chip filter-chip-attention ${query.view === "needs-action" ? "active" : ""}`}
        href={dashboardHref({ ...base, view: "needs-action" })}
      >
        Needs action
      </Link>
      {statusFilters.map((filter) => {
        const isActive = query.status === filter.value;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`filter-chip ${isActive ? "active" : ""}`}
            href={dashboardHref({ ...base, status: filter.value })}
            key={filter.value}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

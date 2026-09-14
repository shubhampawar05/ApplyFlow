import Link from "next/link";

const filters = [
  { value: "", label: "All" },
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

export function DashboardFilters({ activeStatus }: { activeStatus?: string }) {
  return (
    <div className="dashboard-filters">
      {filters.map((filter) => {
        const href = filter.value ? `/dashboard?status=${filter.value}` : "/dashboard";
        const isActive = (activeStatus ?? "") === filter.value;

        return (
          <Link className={`filter-chip ${isActive ? "active" : ""}`} href={href} key={filter.label}>
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

// Purpose: parse and build dashboard URL state (search, sort, status, needs-action view).
// Constraints: pure helpers only; invalid URL values fall back to defaults via applicationListQuerySchema.
import { applicationListQuerySchema, type ApplicationListQuery } from "@/features/applications/application.schemas";

export type DashboardQuery = Pick<ApplicationListQuery, "q" | "sort" | "status" | "view">;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDashboardQuery(params: RawSearchParams): DashboardQuery {
  const { q, sort, status, view } = applicationListQuerySchema.parse({
    q: firstValue(params.q),
    sort: firstValue(params.sort),
    status: firstValue(params.status),
    view: firstValue(params.view),
  });

  // A status chip and the needs-action view are alternative filters; the view wins if both are present.
  return view ? { q, sort, view, status: undefined } : { q, sort, status, view };
}

export function dashboardHref(query: Partial<DashboardQuery>) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort && query.sort !== "updated") params.set("sort", query.sort);
  if (query.status) params.set("status", query.status);
  if (query.view) params.set("view", query.view);
  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
}

export function hasActiveFilters(query: DashboardQuery) {
  return Boolean(query.q || query.status || query.view);
}

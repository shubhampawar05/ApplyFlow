// Purpose: compute dashboard summary counts for a user's applications.
// Constraints: read-only aggregation; user-scoped queries only.
import { getApplicationStatsForUser } from "./application.repository";

export async function getDashboardSummaryForUser(userId: string) {
  const stats = await getApplicationStatsForUser(userId);

  return {
    total: stats.total,
    inProgress: stats.draft + stats.analyzed + stats.ready,
    sent: stats.sent + stats.followUp,
    outcomes: stats.interview + stats.offer,
    breakdown: stats,
  };
}

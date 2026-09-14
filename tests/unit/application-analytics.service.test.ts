import { describe, expect, it, vi } from "vitest";
import { getDashboardSummaryForUser } from "@/features/applications/application-analytics.service";

vi.mock("@/features/applications/application.repository", () => ({
  getApplicationStatsForUser: vi.fn(),
}));

import { getApplicationStatsForUser } from "@/features/applications/application.repository";

describe("getDashboardSummaryForUser", () => {
  it("aggregates status counts into dashboard summary buckets", async () => {
    vi.mocked(getApplicationStatsForUser).mockResolvedValue({
      draft: 2,
      analyzed: 1,
      ready: 1,
      sent: 3,
      followUp: 1,
      interview: 2,
      rejected: 1,
      offer: 1,
      closed: 0,
      total: 12,
    });

    const summary = await getDashboardSummaryForUser("user-1");

    expect(summary).toEqual({
      total: 12,
      inProgress: 4,
      sent: 4,
      outcomes: 3,
      breakdown: {
        draft: 2,
        analyzed: 1,
        ready: 1,
        sent: 3,
        followUp: 1,
        interview: 2,
        rejected: 1,
        offer: 1,
        closed: 0,
        total: 12,
      },
    });
  });
});

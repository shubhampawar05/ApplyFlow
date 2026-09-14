import { describe, expect, it, vi } from "vitest";
import { findLikelyDuplicateApplicationsForUser } from "@/features/applications/application-duplicate.service";

vi.mock("@/features/applications/application.repository", () => ({
  listApplicationsForDuplicateCheck: vi.fn(),
}));

import { listApplicationsForDuplicateCheck } from "@/features/applications/application.repository";

describe("findLikelyDuplicateApplicationsForUser", () => {
  it("returns matching applications based on normalized identity", async () => {
    vi.mocked(listApplicationsForDuplicateCheck).mockResolvedValue({
      current: {
        id: "app-current",
        job: {
          company: "Acme Inc",
          title: "Backend Engineer",
          applicationEmail: "jobs@acme.com",
          normalizedCompany: "acme inc",
          normalizedTitle: "backend engineer",
          normalizedApplicationEmail: "jobs@acme.com",
        },
      },
      others: [
        {
          id: "app-duplicate",
          status: "SENT",
          updatedAt: new Date("2026-09-10T10:00:00.000Z"),
          job: {
            company: "Acme, Inc.",
            title: "Backend Engineer",
            applicationEmail: "jobs@acme.com",
            normalizedCompany: "acme inc",
            normalizedTitle: "backend engineer",
            normalizedApplicationEmail: "jobs@acme.com",
          },
        },
        {
          id: "app-different",
          status: "READY",
          updatedAt: new Date("2026-09-09T10:00:00.000Z"),
          job: {
            company: "Beta Corp",
            title: "Backend Engineer",
            applicationEmail: "jobs@beta.com",
            normalizedCompany: "beta corp",
            normalizedTitle: "backend engineer",
            normalizedApplicationEmail: "jobs@beta.com",
          },
        },
      ],
    });

    const duplicates = await findLikelyDuplicateApplicationsForUser("user-1", "app-current");

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.id).toBe("app-duplicate");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/get-api-current-user", () => ({
  getApiCurrentUser: vi.fn(),
}));

vi.mock("@/lib/storage/object-storage", () => ({ uploadPrivateObject: vi.fn() }));
vi.mock("@/features/jobs/job.repository", () => ({ createScreenshotJob: vi.fn() }));

vi.mock("@/features/applications/application.repository", () => ({
  createDraftApplicationForJob: vi.fn(),
  listApplicationsForUser: vi.fn(),
}));

import { GET } from "@/app/api/applications/route";
import { listApplicationsForUser } from "@/features/applications/application.repository";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";

describe("GET /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiCurrentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(listApplicationsForUser).mockResolvedValue([]);
  });

  it("rejects signed-out requests", async () => {
    vi.mocked(getApiCurrentUser).mockResolvedValue(null as never);

    const response = await GET(new Request("http://localhost/api/applications"));

    expect(response.status).toBe(401);
    expect(listApplicationsForUser).not.toHaveBeenCalled();
  });

  it("falls back to sorting by last updated for an unknown sort", async () => {
    const response = await GET(new Request("http://localhost/api/applications?sort=price&q=acme"));

    expect(response.status).toBe(200);
    expect(listApplicationsForUser).toHaveBeenCalledWith("user-1", {
      limit: 50,
      status: undefined,
      q: "acme",
      sort: "updated",
      needsAction: false,
    });
  });

  it("passes the needs-action view for the signed-in user", async () => {
    await GET(new Request("http://localhost/api/applications?view=needs-action&sort=match"));

    expect(listApplicationsForUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ needsAction: true, sort: "match" }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/get-api-current-user", () => ({
  getApiCurrentUser: vi.fn(),
}));

vi.mock("@/features/applications/application-send.service", async () => {
  class ApplicationSendError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { ApplicationSendError, resolveSendOutcomeForUser: vi.fn() };
});

import { POST } from "@/app/api/applications/[id]/send-outcome/route";
import {
  ApplicationSendError,
  resolveSendOutcomeForUser,
} from "@/features/applications/application-send.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";

function call(body: unknown) {
  return POST(
    new Request("http://localhost/api/applications/app-1/send-outcome", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "app-1" }) },
  );
}

describe("POST /api/applications/:id/send-outcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiCurrentUser).mockResolvedValue({ id: "user-1" } as never);
  });

  it("rejects signed-out requests", async () => {
    vi.mocked(getApiCurrentUser).mockResolvedValue(null as never);

    const response = await call({ sent: true });

    expect(response.status).toBe(401);
    expect(resolveSendOutcomeForUser).not.toHaveBeenCalled();
  });

  it("resolves for the signed-in user", async () => {
    vi.mocked(resolveSendOutcomeForUser).mockResolvedValue({ application: { status: "SENT" } } as never);

    const response = await call({ sent: true });

    expect(response.status).toBe(200);
    expect(resolveSendOutcomeForUser).toHaveBeenCalledWith("user-1", "app-1", { sent: true });
  });

  it("returns 404 for an application the user does not own", async () => {
    vi.mocked(resolveSendOutcomeForUser).mockRejectedValue(new ApplicationSendError("NOT_FOUND", "Application not found."));

    const response = await call({ sent: false });

    expect(response.status).toBe(404);
  });

  it("returns 409 when nothing is waiting to be resolved", async () => {
    vi.mocked(resolveSendOutcomeForUser).mockRejectedValue(new ApplicationSendError("NOT_RESOLVABLE", "Nothing to resolve."));

    const response = await call({ sent: true });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("NOT_RESOLVABLE");
  });
});

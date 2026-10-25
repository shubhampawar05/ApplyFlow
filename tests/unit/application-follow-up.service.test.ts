import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/applications/application.repository", () => ({
  getApplicationForUser: vi.fn(),
  updateApplicationFollowUp: vi.fn(),
}));

import {
  isFollowUpDue,
  updateFollowUpForUser,
} from "@/features/applications/application-follow-up.service";
import {
  getApplicationForUser,
  updateApplicationFollowUp,
} from "@/features/applications/application.repository";

const now = new Date("2026-10-25T12:00:00.000Z");

describe("updateFollowUpForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApplicationForUser).mockResolvedValue({ id: "app-1", status: "SENT" } as never);
    vi.mocked(updateApplicationFollowUp).mockResolvedValue({ id: "app-1" } as never);
  });

  it("reschedules to a later date and records an event", async () => {
    await updateFollowUpForUser("user-1", "app-1", { action: "reschedule", followUpAt: "2026-11-02" }, now);

    expect(updateApplicationFollowUp).toHaveBeenCalledWith("app-1", {
      data: { followUpAt: new Date("2026-11-02T00:00:00.000Z"), followUpCompletedAt: null },
      eventType: "FOLLOW_UP_RESCHEDULED",
      metadata: { followUpAt: "2026-11-02T00:00:00.000Z" },
    });
  });

  it("accepts today", async () => {
    await updateFollowUpForUser("user-1", "app-1", { action: "reschedule", followUpAt: "2026-10-25" }, now);

    expect(updateApplicationFollowUp).toHaveBeenCalled();
  });

  it("rejects a past date", async () => {
    await expect(
      updateFollowUpForUser("user-1", "app-1", { action: "reschedule", followUpAt: "2026-10-01" }, now),
    ).rejects.toMatchObject({ code: "INVALID_FOLLOW_UP_DATE" });
    expect(updateApplicationFollowUp).not.toHaveBeenCalled();
  });

  it("rejects a value that is not a date", async () => {
    await expect(
      updateFollowUpForUser("user-1", "app-1", { action: "reschedule", followUpAt: "next week" }, now),
    ).rejects.toThrow();
    await expect(
      updateFollowUpForUser("user-1", "app-1", { action: "reschedule", followUpAt: "2026-13-45" }, now),
    ).rejects.toThrow();
    expect(updateApplicationFollowUp).not.toHaveBeenCalled();
  });

  it("marks the follow-up done", async () => {
    await updateFollowUpForUser("user-1", "app-1", { action: "complete" }, now);

    expect(updateApplicationFollowUp).toHaveBeenCalledWith("app-1", {
      data: { followUpCompletedAt: now },
      eventType: "FOLLOW_UP_COMPLETED",
    });
  });

  it("clears the follow-up", async () => {
    await updateFollowUpForUser("user-1", "app-1", { action: "clear" }, now);

    expect(updateApplicationFollowUp).toHaveBeenCalledWith("app-1", {
      data: { followUpAt: null, followUpCompletedAt: null },
      eventType: "FOLLOW_UP_CLEARED",
    });
  });

  it("refuses follow-ups before the email is sent", async () => {
    for (const status of ["DRAFT", "ANALYZED", "READY", "SENDING"]) {
      vi.mocked(getApplicationForUser).mockResolvedValue({ id: "app-1", status } as never);
      await expect(updateFollowUpForUser("user-1", "app-1", { action: "clear" }, now)).rejects.toMatchObject({
        code: "FOLLOW_UP_NOT_AVAILABLE",
      });
    }
    expect(updateApplicationFollowUp).not.toHaveBeenCalled();
  });

  it("refuses another user's application", async () => {
    vi.mocked(getApplicationForUser).mockResolvedValue(null);

    await expect(updateFollowUpForUser("user-2", "app-1", { action: "complete" }, now)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(getApplicationForUser).toHaveBeenCalledWith("user-2", "app-1");
    expect(updateApplicationFollowUp).not.toHaveBeenCalled();
  });
});

describe("isFollowUpDue", () => {
  const base = { status: "SENT", followUpCompletedAt: null };

  it("is due at and after the follow-up time", () => {
    expect(isFollowUpDue({ ...base, followUpAt: new Date("2026-10-25T00:00:00.000Z") }, now)).toBe(true);
    expect(isFollowUpDue({ ...base, followUpAt: new Date("2026-10-25T12:00:00.000Z") }, now)).toBe(true);
  });

  it("is not due before the follow-up time", () => {
    expect(isFollowUpDue({ ...base, followUpAt: new Date("2026-10-26T00:00:00.000Z") }, now)).toBe(false);
  });

  it("is not due when done or cleared", () => {
    const past = new Date("2026-10-20T00:00:00.000Z");
    expect(isFollowUpDue({ ...base, followUpAt: past, followUpCompletedAt: now }, now)).toBe(false);
    expect(isFollowUpDue({ ...base, followUpAt: null }, now)).toBe(false);
  });

  it("stops reminding once the application reaches an outcome", () => {
    const past = new Date("2026-10-20T00:00:00.000Z");
    for (const status of ["INTERVIEW", "OFFER", "REJECTED", "CLOSED"]) {
      expect(isFollowUpDue({ status, followUpAt: past, followUpCompletedAt: null }, now)).toBe(false);
    }
    expect(isFollowUpDue({ status: "FOLLOW_UP", followUpAt: past, followUpCompletedAt: null }, now)).toBe(true);
  });
});

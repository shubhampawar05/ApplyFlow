import { describe, expect, it } from "vitest";
import {
  isSendInProgress,
  isSendOutcomeUnknown,
  SEND_CLAIM_STALE_AFTER_MS,
} from "@/features/applications/application-send-state";

const now = new Date("2026-10-25T12:00:00.000Z");

describe("application send state", () => {
  it("treats a fresh SENDING claim as in progress", () => {
    const application = {
      status: "SENDING",
      sendOutcomeUnknown: false,
      sendStartedAt: new Date(now.getTime() - 10_000),
    };

    expect(isSendInProgress(application, now)).toBe(true);
    expect(isSendOutcomeUnknown(application, now)).toBe(false);
  });

  it("treats a SENDING claim older than the stale window as unknown", () => {
    const application = {
      status: "SENDING",
      sendOutcomeUnknown: false,
      sendStartedAt: new Date(now.getTime() - SEND_CLAIM_STALE_AFTER_MS - 1),
    };

    expect(isSendOutcomeUnknown(application, now)).toBe(true);
    expect(isSendInProgress(application, now)).toBe(false);
  });

  it("treats a flagged SENDING claim as unknown", () => {
    expect(
      isSendOutcomeUnknown({ status: "SENDING", sendOutcomeUnknown: true, sendStartedAt: now }, now),
    ).toBe(true);
  });

  it("never treats other statuses as sending", () => {
    for (const status of ["READY", "SENT", "INTERVIEW"]) {
      const application = { status, sendOutcomeUnknown: true, sendStartedAt: null };
      expect(isSendOutcomeUnknown(application, now)).toBe(false);
      expect(isSendInProgress(application, now)).toBe(false);
    }
  });
});

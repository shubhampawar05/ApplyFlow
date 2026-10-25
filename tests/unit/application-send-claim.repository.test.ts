import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  application: {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
  },
  emailDelivery: { create: vi.fn() },
  applicationEvent: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  claimApplicationForSend,
  listApplicationsForUser,
  listDueFollowUpsForUser,
  recordSuccessfulEmailDelivery,
  resolveUnknownSendOutcome,
} from "@/features/applications/application.repository";

describe("send claim repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    );
  });

  it("claims only a READY application owned by the user", async () => {
    prismaMock.application.updateMany.mockResolvedValue({ count: 1 });
    const now = new Date("2026-10-25T12:00:00.000Z");

    await expect(claimApplicationForSend("user-1", "app-1", now)).resolves.toEqual({ claimed: true });
    expect(prismaMock.application.updateMany).toHaveBeenCalledWith({
      where: { id: "app-1", userId: "user-1", status: "READY" },
      data: { status: "SENDING", sendStartedAt: now, sendOutcomeUnknown: false },
    });
  });

  it("reports a lost claim with the current state", async () => {
    const startedAt = new Date();
    prismaMock.application.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.application.findFirst.mockResolvedValue({
      status: "SENDING",
      sendOutcomeUnknown: false,
      sendStartedAt: startedAt,
    });

    await expect(claimApplicationForSend("user-1", "app-1")).resolves.toEqual({
      claimed: false,
      status: "SENDING",
      sendOutcomeUnknown: false,
      sendStartedAt: startedAt,
    });
    expect(prismaMock.application.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "app-1", userId: "user-1" } }),
    );
  });

  it("sets SENT and a follow-up 7 days after the send", async () => {
    const sentAt = new Date("2026-10-25T12:00:00.000Z");
    prismaMock.emailDelivery.create.mockResolvedValue({ id: "delivery-1" });
    prismaMock.application.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.application.findUniqueOrThrow.mockResolvedValue({ id: "app-1", status: "SENT" });

    await recordSuccessfulEmailDelivery({
      applicationId: "app-1",
      generatedEmailId: "email-1",
      recipient: "hiring@acme.com",
      providerMessageId: "msg-1",
      sentAt,
    });

    expect(prismaMock.application.updateMany).toHaveBeenCalledWith({
      where: { id: "app-1", status: "SENDING" },
      data: expect.objectContaining({
        status: "SENT",
        followUpAt: new Date("2026-11-01T12:00:00.000Z"),
      }),
    });
  });

  it("fails the delivery record when the claim was lost", async () => {
    prismaMock.emailDelivery.create.mockResolvedValue({ id: "delivery-1" });
    prismaMock.application.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      recordSuccessfulEmailDelivery({
        applicationId: "app-1",
        generatedEmailId: "email-1",
        recipient: "hiring@acme.com",
        providerMessageId: "msg-1",
      }),
    ).rejects.toThrow("SEND_CLAIM_LOST");
    expect(prismaMock.applicationEvent.create).not.toHaveBeenCalled();
  });

  it("records a manual confirmation event when resolving as sent", async () => {
    prismaMock.application.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.application.findUniqueOrThrow.mockResolvedValue({ id: "app-1", status: "SENT" });

    await resolveUnknownSendOutcome("app-1", { sent: true });

    expect(prismaMock.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "SEND_CONFIRMED_MANUALLY", toStatus: "SENT" }),
    });
  });

  it("lists only the user's open, due follow-ups for active statuses, oldest first", async () => {
    prismaMock.application.findMany.mockResolvedValue([]);
    const now = new Date("2026-10-25T23:59:59.000Z");

    await listDueFollowUpsForUser("user-1", now);

    expect(prismaMock.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          status: { in: ["SENT", "FOLLOW_UP"] },
          followUpAt: { lte: now },
          followUpCompletedAt: null,
        },
        orderBy: { followUpAt: "asc" },
      }),
    );
  });

  it("always scopes the dashboard list to the user, including searches and needs-action", async () => {
    prismaMock.application.findMany.mockResolvedValue([]);
    const now = new Date("2026-10-25T12:00:00.000Z");

    await listApplicationsForUser("user-1", { q: "acme", needsAction: true, sort: "match", now });

    const call = prismaMock.application.findMany.mock.calls[0]?.[0];
    expect(call.where.userId).toBe("user-1");
    expect(call.where.AND).toEqual(
      expect.arrayContaining([
        {
          job: {
            OR: [
              { company: { contains: "acme", mode: "insensitive" } },
              { title: { contains: "acme", mode: "insensitive" } },
            ],
          },
        },
      ]),
    );
    expect(call.orderBy).toEqual([{ matchScore: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }]);
  });
});

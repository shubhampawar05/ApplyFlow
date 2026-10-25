import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveSendOutcomeForUser,
  sendApplicationEmailForUser,
} from "@/features/applications/application-send.service";

vi.mock("@/features/applications/application.repository", () => ({
  claimApplicationForSend: vi.fn(),
  getApplicationSendContext: vi.fn(),
  markSendOutcomeUnknown: vi.fn(),
  recordSuccessfulEmailDelivery: vi.fn(),
  releaseSendClaim: vi.fn(),
  resolveUnknownSendOutcome: vi.fn(),
}));

vi.mock("@/features/applications/application-duplicate.service", () => ({
  findLikelyDuplicateApplicationsForUser: vi.fn(),
}));

vi.mock("@/features/integrations/gmail/gmail.service", () => ({
  sendGmailMessageForUser: vi.fn(),
  GmailServiceError: class GmailServiceError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/storage/object-storage", () => ({
  downloadPrivateObject: vi.fn(),
}));

import {
  claimApplicationForSend,
  getApplicationSendContext,
  markSendOutcomeUnknown,
  recordSuccessfulEmailDelivery,
  releaseSendClaim,
  resolveUnknownSendOutcome,
} from "@/features/applications/application.repository";
import { findLikelyDuplicateApplicationsForUser } from "@/features/applications/application-duplicate.service";
import { GmailServiceError, sendGmailMessageForUser } from "@/features/integrations/gmail/gmail.service";

function readyApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: "app-1",
    status: "READY",
    sendOutcomeUnknown: false,
    sendStartedAt: null,
    resumeId: "resume-1",
    resume: {
      id: "resume-1",
      fileName: "resume.pdf",
      storageKey: "resumes/user-1/resume.pdf",
      mimeType: "application/pdf",
    },
    job: { applicationEmail: "hiring@acme.com" },
    emails: [
      {
        id: "email-1",
        isSelected: true,
        to: "hiring@acme.com",
        subject: "Application",
        body: "Hello",
      },
    ],
    ...overrides,
  };
}
import { downloadPrivateObject } from "@/lib/storage/object-storage";

describe("sendApplicationEmailForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findLikelyDuplicateApplicationsForUser).mockResolvedValue([]);
    vi.mocked(downloadPrivateObject).mockResolvedValue(new Uint8Array([1, 2, 3]));
    vi.mocked(sendGmailMessageForUser).mockResolvedValue({ providerMessageId: "msg-1" });
    vi.mocked(claimApplicationForSend).mockResolvedValue({ claimed: true });
    vi.mocked(recordSuccessfulEmailDelivery).mockResolvedValue({
      application: { id: "app-1", status: "SENT" },
      delivery: { id: "delivery-1" },
    } as never);
  });

  it("attaches the selected resume when sending", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue({
      id: "app-1",
      status: "READY",
      resumeId: "resume-1",
      resume: {
        id: "resume-1",
        fileName: "resume.pdf",
        storageKey: "resumes/user-1/resume.pdf",
        mimeType: "application/pdf",
      },
      job: { applicationEmail: "hiring@acme.com" },
      emails: [
        {
          id: "email-1",
          isSelected: true,
          to: "hiring@acme.com",
          subject: "Application",
          body: "Hello",
        },
      ],
    } as never);

    await sendApplicationEmailForUser("user-1", "app-1", { confirm: true });

    expect(downloadPrivateObject).toHaveBeenCalledWith("resumes/user-1/resume.pdf");
    expect(sendGmailMessageForUser).toHaveBeenCalledWith("user-1", {
      to: "hiring@acme.com",
      subject: "Application",
      body: "Hello",
      attachment: {
        fileName: "resume.pdf",
        mimeType: "application/pdf",
        content: new Uint8Array([1, 2, 3]),
      },
    });
  });

  it("blocks send when the resume file cannot be loaded", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue({
      id: "app-1",
      status: "READY",
      resumeId: "resume-1",
      resume: {
        id: "resume-1",
        fileName: "resume.pdf",
        storageKey: "resumes/user-1/resume.pdf",
        mimeType: "application/pdf",
      },
      job: { applicationEmail: "hiring@acme.com" },
      emails: [
        {
          id: "email-1",
          isSelected: true,
          to: "hiring@acme.com",
          subject: "Application",
          body: "Hello",
        },
      ],
    } as never);
    vi.mocked(downloadPrivateObject).mockRejectedValue(new Error("STORAGE_OBJECT_NOT_FOUND"));

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "RESUME_ATTACHMENT_FAILED",
    });
    expect(sendGmailMessageForUser).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation", async () => {
    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: false })).rejects.toThrow();
    expect(getApplicationSendContext).not.toHaveBeenCalled();
  });

  it("never calls Gmail without explicit confirmation", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication() as never);

    await expect(sendApplicationEmailForUser("user-1", "app-1", {})).rejects.toThrow();
    expect(claimApplicationForSend).not.toHaveBeenCalled();
    expect(sendGmailMessageForUser).not.toHaveBeenCalled();
  });

  it("lets only one of two concurrent sends reach Gmail", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication() as never);
    let claimTaken = false;
    vi.mocked(claimApplicationForSend).mockImplementation(async () => {
      if (claimTaken) {
        return { claimed: false, status: "SENDING", sendOutcomeUnknown: false, sendStartedAt: new Date() };
      }
      claimTaken = true;
      return { claimed: true };
    });

    const results = await Promise.allSettled([
      sendApplicationEmailForUser("user-1", "app-1", { confirm: true }),
      sendApplicationEmailForUser("user-1", "app-1", { confirm: true }),
    ]);

    expect(sendGmailMessageForUser).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: "SEND_IN_PROGRESS" });
  });

  it("rejects a send while another send is in progress without calling Gmail", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(
      readyApplication({ status: "SENDING", sendStartedAt: new Date() }) as never,
    );

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "SEND_IN_PROGRESS",
    });
    expect(sendGmailMessageForUser).not.toHaveBeenCalled();
  });

  it("rejects a send while the previous outcome is unknown", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(
      readyApplication({ status: "SENDING", sendOutcomeUnknown: true, sendStartedAt: new Date() }) as never,
    );

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "SEND_OUTCOME_UNKNOWN",
    });
    expect(sendGmailMessageForUser).not.toHaveBeenCalled();
  });

  it("rejects a send after the application moved past SENT", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication({ status: "INTERVIEW" }) as never);

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "ALREADY_SENT",
    });
    expect(sendGmailMessageForUser).not.toHaveBeenCalled();
  });

  it("releases the claim when Gmail definitely rejects the message", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication() as never);
    vi.mocked(sendGmailMessageForUser).mockRejectedValue(
      new GmailServiceError("GMAIL_SEND_REJECTED", "Gmail rejected the send request."),
    );

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "GMAIL_SEND_REJECTED",
    });
    expect(releaseSendClaim).toHaveBeenCalledWith("app-1");
    expect(markSendOutcomeUnknown).not.toHaveBeenCalled();
  });

  it("holds the application as unknown when Gmail's outcome is unclear", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication() as never);
    vi.mocked(sendGmailMessageForUser).mockRejectedValue(
      new GmailServiceError("GMAIL_SEND_UNKNOWN", "Unknown outcome."),
    );

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "SEND_OUTCOME_UNKNOWN",
    });
    expect(markSendOutcomeUnknown).toHaveBeenCalledWith("app-1");
    expect(releaseSendClaim).not.toHaveBeenCalled();
  });

  it("holds the application as unknown when saving fails after Gmail sent", async () => {
    vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication() as never);
    vi.mocked(recordSuccessfulEmailDelivery).mockRejectedValue(new Error("db down"));

    await expect(sendApplicationEmailForUser("user-1", "app-1", { confirm: true })).rejects.toMatchObject({
      code: "SEND_OUTCOME_UNKNOWN",
    });
    expect(sendGmailMessageForUser).toHaveBeenCalledTimes(1);
    expect(markSendOutcomeUnknown).toHaveBeenCalledWith("app-1");
    expect(releaseSendClaim).not.toHaveBeenCalled();
  });

  describe("resolveSendOutcomeForUser", () => {
    it("marks an unknown outcome as sent without calling Gmail", async () => {
      vi.mocked(getApplicationSendContext).mockResolvedValue(
        readyApplication({ status: "SENDING", sendOutcomeUnknown: true, sendStartedAt: new Date() }) as never,
      );
      vi.mocked(resolveUnknownSendOutcome).mockResolvedValue({ id: "app-1", status: "SENT" } as never);

      await expect(resolveSendOutcomeForUser("user-1", "app-1", { sent: true })).resolves.toMatchObject({
        application: { status: "SENT" },
      });
      expect(resolveUnknownSendOutcome).toHaveBeenCalledWith("app-1", { sent: true });
      expect(sendGmailMessageForUser).not.toHaveBeenCalled();
    });

    it("marks an unknown outcome as not sent", async () => {
      vi.mocked(getApplicationSendContext).mockResolvedValue(
        readyApplication({ status: "SENDING", sendOutcomeUnknown: true, sendStartedAt: new Date() }) as never,
      );
      vi.mocked(resolveUnknownSendOutcome).mockResolvedValue({ id: "app-1", status: "READY" } as never);

      await expect(resolveSendOutcomeForUser("user-1", "app-1", { sent: false })).resolves.toMatchObject({
        application: { status: "READY" },
      });
    });

    it("refuses to resolve an application that is not unknown", async () => {
      vi.mocked(getApplicationSendContext).mockResolvedValue(readyApplication() as never);

      await expect(resolveSendOutcomeForUser("user-1", "app-1", { sent: true })).rejects.toMatchObject({
        code: "NOT_RESOLVABLE",
      });
      expect(resolveUnknownSendOutcome).not.toHaveBeenCalled();
    });

    it("refuses to resolve another user's application", async () => {
      vi.mocked(getApplicationSendContext).mockResolvedValue(null);

      await expect(resolveSendOutcomeForUser("user-2", "app-1", { sent: true })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(getApplicationSendContext).toHaveBeenCalledWith("user-2", "app-1");
      expect(resolveUnknownSendOutcome).not.toHaveBeenCalled();
    });

    it("rejects an invalid body", async () => {
      await expect(resolveSendOutcomeForUser("user-1", "app-1", { sent: "yes" })).rejects.toThrow();
      expect(resolveUnknownSendOutcome).not.toHaveBeenCalled();
    });
  });
});

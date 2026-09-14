import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendApplicationEmailForUser } from "@/features/applications/application-send.service";

vi.mock("@/features/applications/application.repository", () => ({
  getApplicationSendContext: vi.fn(),
  recordSuccessfulEmailDelivery: vi.fn(),
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
  getApplicationSendContext,
  recordSuccessfulEmailDelivery,
} from "@/features/applications/application.repository";
import { findLikelyDuplicateApplicationsForUser } from "@/features/applications/application-duplicate.service";
import { sendGmailMessageForUser } from "@/features/integrations/gmail/gmail.service";
import { downloadPrivateObject } from "@/lib/storage/object-storage";

describe("sendApplicationEmailForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findLikelyDuplicateApplicationsForUser).mockResolvedValue([]);
    vi.mocked(downloadPrivateObject).mockResolvedValue(new Uint8Array([1, 2, 3]));
    vi.mocked(sendGmailMessageForUser).mockResolvedValue({ providerMessageId: "msg-1" });
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
});

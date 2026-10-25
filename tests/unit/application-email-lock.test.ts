import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/applications/application.repository", () => ({
  createSelectedGeneratedEmail: vi.fn(),
  getApplicationEmailContext: vi.fn(),
  markApplicationReady: vi.fn(),
  updateSelectedGeneratedEmail: vi.fn(),
}));

vi.mock("@/features/applications/application-duplicate.service", () => ({
  ApplicationDuplicateError: class extends Error {},
  assertApplicationNotDuplicateBlocked: vi.fn(),
}));

vi.mock("@/features/ai/email-generation.adapter", () => ({
  EMAIL_GENERATION_PROMPT_VERSION: "test",
  generateApplicationEmail: vi.fn(),
}));

vi.mock("@/features/ai/ai.repository", () => ({
  completeAiRequest: vi.fn(),
  createAiRequest: vi.fn(),
}));

vi.mock("@/features/applications/application-match.service", () => ({
  parseStoredMatchDetails: vi.fn(),
}));

vi.mock("@/features/resume/resume.repository", () => ({
  getDefaultResumeWithProfile: vi.fn(),
}));

import {
  generateApplicationEmailForUser,
  updateApplicationEmailForUser,
} from "@/features/applications/application-email.service";
import {
  getApplicationEmailContext,
  markApplicationReady,
  updateSelectedGeneratedEmail,
} from "@/features/applications/application.repository";
import { generateApplicationEmail } from "@/features/ai/email-generation.adapter";

describe("email lock after send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const status of ["SENDING", "SENT", "INTERVIEW"]) {
    it(`blocks editing the draft when status is ${status}`, async () => {
      vi.mocked(getApplicationEmailContext).mockResolvedValue({
        id: "app-1",
        status,
        emails: [{ id: "email-1", isSelected: true }],
      } as never);

      await expect(
        updateApplicationEmailForUser("user-1", "app-1", { subject: "New", body: "New body" }),
      ).rejects.toMatchObject({ code: "EMAIL_LOCKED" });
      expect(updateSelectedGeneratedEmail).not.toHaveBeenCalled();
      expect(markApplicationReady).not.toHaveBeenCalled();
    });

    it(`blocks regenerating the draft when status is ${status}`, async () => {
      vi.mocked(getApplicationEmailContext).mockResolvedValue({
        id: "app-1",
        status,
        job: { applicationEmail: "hiring@acme.com" },
        emails: [],
        events: [],
      } as never);

      await expect(generateApplicationEmailForUser("user-1", "app-1")).rejects.toMatchObject({
        code: "EMAIL_LOCKED",
      });
      expect(generateApplicationEmail).not.toHaveBeenCalled();
    });
  }
});

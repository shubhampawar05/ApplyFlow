import { describe, expect, it } from "vitest";
import {
  buildResumeStorageKey,
  prepareResumeUpload,
  ResumeValidationError,
  sanitizeResumeFileName,
  validateResumeUploadMeta,
} from "@/features/resume/resume.service";

describe("resume upload validation", () => {
  it("accepts PDF and DOCX resumes up to 10 MB", () => {
    expect(
      validateResumeUploadMeta({
        fileName: "Alex Example.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
      }),
    ).toEqual({
      fileName: "Alex Example.pdf",
      mimeType: "application/pdf",
      byteSize: 1024,
    });
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      validateResumeUploadMeta({
        fileName: "resume.txt",
        mimeType: "text/plain",
        byteSize: 100,
      }),
    ).toThrow(ResumeValidationError);
  });

  it("rejects files larger than 10 MB", () => {
    expect(() =>
      validateResumeUploadMeta({
        fileName: "resume.pdf",
        mimeType: "application/pdf",
        byteSize: 10 * 1024 * 1024 + 1,
      }),
    ).toThrow(ResumeValidationError);
  });
});

describe("resume storage keys", () => {
  it("sanitizes file names and scopes storage keys to the user", () => {
    expect(sanitizeResumeFileName("../../secret.pdf")).toBe("secret.pdf");

    const prepared = prepareResumeUpload({
      userId: "user-1",
      fileName: "My Resume.pdf",
      mimeType: "application/pdf",
      byteSize: 2048,
    });

    expect(prepared.storageKey).toMatch(/^users\/user-1\/resumes\/[0-9a-f-]+\/My Resume\.pdf$/);
    expect(buildResumeStorageKey("user-1", "resume.pdf")).toMatch(/^users\/user-1\/resumes\//);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildJobScreenshotStorageKey,
  JobScreenshotValidationError,
  prepareJobScreenshotUpload,
  validateJobScreenshotUploadMeta,
} from "@/features/jobs/job-screenshot.service";

describe("job screenshot upload validation", () => {
  it("accepts PNG, JPG, and WEBP screenshots up to 10 MB", () => {
    expect(
      validateJobScreenshotUploadMeta({
        fileName: "role.png",
        mimeType: "image/png",
        byteSize: 1024,
      }),
    ).toEqual({
      fileName: "role.png",
      mimeType: "image/png",
      byteSize: 1024,
    });
  });

  it("rejects unsupported image types", () => {
    expect(() =>
      validateJobScreenshotUploadMeta({
        fileName: "role.gif",
        mimeType: "image/gif",
        byteSize: 100,
      }),
    ).toThrow(JobScreenshotValidationError);
  });

  it("builds user-scoped storage keys for screenshot intake", () => {
    const prepared = prepareJobScreenshotUpload({
      userId: "user-1",
      fileName: "Senior Engineer.webp",
      mimeType: "image/webp",
      byteSize: 2048,
    });

    expect(prepared.storageKey).toMatch(/^users\/user-1\/jobs\/screenshots\/[0-9a-f-]+\/Senior Engineer\.webp$/);
    expect(buildJobScreenshotStorageKey("user-1", "job.jpg")).toMatch(/^users\/user-1\/jobs\/screenshots\//);
  });
});

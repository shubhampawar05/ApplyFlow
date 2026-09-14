import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPrivateMediaForUser, MediaAccessError } from "@/features/media/media.service";

vi.mock("@/features/jobs/job.repository", () => ({
  getJobForUser: vi.fn(),
}));

vi.mock("@/features/resume/resume.repository", () => ({
  getResumeOwnedByUser: vi.fn(),
}));

vi.mock("@/lib/storage/object-storage", () => ({
  downloadPrivateObject: vi.fn(),
}));

import { getJobForUser } from "@/features/jobs/job.repository";
import { getResumeOwnedByUser } from "@/features/resume/resume.repository";
import { downloadPrivateObject } from "@/lib/storage/object-storage";

describe("getPrivateMediaForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(downloadPrivateObject).mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  it("returns job screenshot bytes for an owned job", async () => {
    vi.mocked(getJobForUser).mockResolvedValue({
      id: "job-1",
      screenshotStorageKey: "jobs/user-1/posting.png",
    } as never);

    const media = await getPrivateMediaForUser("user-1", "job-screenshot", "job-1");

    expect(downloadPrivateObject).toHaveBeenCalledWith("jobs/user-1/posting.png");
    expect(media.mimeType).toBe("image/png");
    expect(media.fileName).toBe("posting.png");
  });

  it("returns resume bytes for an owned resume", async () => {
    vi.mocked(getResumeOwnedByUser).mockResolvedValue({
      id: "resume-1",
      storageKey: "resumes/user-1/resume.pdf",
      mimeType: "application/pdf",
      fileName: "resume.pdf",
    } as never);

    const media = await getPrivateMediaForUser("user-1", "resume", "resume-1");

    expect(downloadPrivateObject).toHaveBeenCalledWith("resumes/user-1/resume.pdf");
    expect(media.mimeType).toBe("application/pdf");
    expect(media.fileName).toBe("resume.pdf");
  });

  it("rejects missing screenshots", async () => {
    vi.mocked(getJobForUser).mockResolvedValue({
      id: "job-1",
      screenshotStorageKey: null,
    } as never);

    await expect(getPrivateMediaForUser("user-1", "job-screenshot", "job-1")).rejects.toBeInstanceOf(
      MediaAccessError,
    );
  });
});

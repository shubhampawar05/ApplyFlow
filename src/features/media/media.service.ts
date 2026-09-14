// Purpose: resolve auth-scoped private media from storage for browser preview and download.
// Constraints: user ownership required; never expose storage keys in responses.
import { mimeTypeFromStorageKey } from "@/features/jobs/job-media";
import { getJobForUser } from "@/features/jobs/job.repository";
import { getResumeOwnedByUser } from "@/features/resume/resume.repository";
import { downloadPrivateObject } from "@/lib/storage/object-storage";
import type { MediaType } from "./media.schemas";

export class MediaAccessError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MediaAccessError";
    this.code = code;
  }
}

function fileNameFromStorageKey(storageKey: string) {
  const parts = storageKey.split("/");
  return parts[parts.length - 1] || "file";
}

export async function getPrivateMediaForUser(userId: string, type: MediaType, resourceId: string) {
  if (type === "job-screenshot") {
    const job = await getJobForUser(userId, resourceId);
    if (!job?.screenshotStorageKey) {
      throw new MediaAccessError("NOT_FOUND", "Screenshot not found.");
    }

    try {
      const bytes = await downloadPrivateObject(job.screenshotStorageKey);
      return {
        bytes,
        mimeType: mimeTypeFromStorageKey(job.screenshotStorageKey),
        fileName: fileNameFromStorageKey(job.screenshotStorageKey),
      };
    } catch {
      throw new MediaAccessError("STORAGE_ERROR", "We could not load this screenshot.");
    }
  }

  const resume = await getResumeOwnedByUser(userId, resourceId);
  if (!resume) {
    throw new MediaAccessError("NOT_FOUND", "Resume not found.");
  }

  try {
    const bytes = await downloadPrivateObject(resume.storageKey);
    return {
      bytes,
      mimeType: resume.mimeType,
      fileName: resume.fileName,
    };
  } catch {
    throw new MediaAccessError("STORAGE_ERROR", "We could not load this resume.");
  }
}

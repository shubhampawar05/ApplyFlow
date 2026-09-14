import { randomUUID } from "node:crypto";
import {
  allowedJobScreenshotMimeTypes,
  JOB_SCREENSHOT_MAX_BYTES,
  jobScreenshotUploadMetaSchema,
  type JobScreenshotUploadMeta,
} from "./job-screenshot.schemas";
import type { JobScreenshotUploadInput, PreparedJobScreenshotUpload } from "./job-screenshot.types";

export class JobScreenshotValidationError extends Error {
  readonly code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "JobScreenshotValidationError";
  }
}

export function sanitizeScreenshotFileName(fileName: string) {
  const baseName = fileName.split(/[/\\]/).pop() ?? "screenshot";
  const cleaned = baseName.replace(/[^\w.\- ()]/g, "_").trim().slice(0, 200);
  return cleaned.length > 0 ? cleaned : "screenshot";
}

export function validateJobScreenshotUploadMeta(input: JobScreenshotUploadMeta) {
  const parsed = jobScreenshotUploadMetaSchema.safeParse(input);
  if (!parsed.success) {
    const sizeIssue = parsed.error.issues.find((issue) => issue.path[0] === "byteSize");
    if (sizeIssue) {
      throw new JobScreenshotValidationError("This image is larger than 10 MB. Please choose a smaller file.");
    }
    throw new JobScreenshotValidationError("Invalid screenshot upload.");
  }

  if (!allowedJobScreenshotMimeTypes.has(parsed.data.mimeType)) {
    throw new JobScreenshotValidationError("Choose a PNG, JPG, or WEBP image.");
  }

  return parsed.data;
}

export function buildJobScreenshotStorageKey(userId: string, fileName: string) {
  const safeName = sanitizeScreenshotFileName(fileName);
  return `users/${userId}/jobs/screenshots/${randomUUID()}/${safeName}`;
}

export function prepareJobScreenshotUpload(input: JobScreenshotUploadInput): PreparedJobScreenshotUpload {
  const validated = validateJobScreenshotUploadMeta({
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });

  return {
    userId: input.userId,
    fileName: sanitizeScreenshotFileName(validated.fileName),
    mimeType: validated.mimeType,
    byteSize: validated.byteSize,
    storageKey: buildJobScreenshotStorageKey(input.userId, validated.fileName),
  };
}

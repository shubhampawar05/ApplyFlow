import { randomUUID } from "node:crypto";
import {
  allowedResumeMimeTypes,
  RESUME_MAX_BYTES,
  resumeUploadMetaSchema,
  type ResumeUploadMeta,
} from "./resume.schemas";
import type { PreparedResumeUpload, ResumeUploadInput } from "./resume.types";

export class ResumeValidationError extends Error {
  readonly code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ResumeValidationError";
  }
}

export function sanitizeResumeFileName(fileName: string) {
  const baseName = fileName.split(/[/\\]/).pop() ?? "resume";
  const cleaned = baseName.replace(/[^\w.\- ()]/g, "_").trim().slice(0, 200);
  return cleaned.length > 0 ? cleaned : "resume";
}

export function validateResumeUploadMeta(input: ResumeUploadMeta) {
  const parsed = resumeUploadMetaSchema.safeParse(input);
  if (!parsed.success) {
    const sizeIssue = parsed.error.issues.find((issue) => issue.path[0] === "byteSize");
    if (sizeIssue) {
      throw new ResumeValidationError("This resume is larger than 10 MB. Please choose a smaller file.");
    }
    throw new ResumeValidationError("Invalid resume upload.");
  }

  if (!allowedResumeMimeTypes.has(parsed.data.mimeType)) {
    throw new ResumeValidationError("Upload a PDF or DOCX resume.");
  }

  return parsed.data;
}

export function buildResumeStorageKey(userId: string, fileName: string) {
  const safeName = sanitizeResumeFileName(fileName);
  return `users/${userId}/resumes/${randomUUID()}/${safeName}`;
}

export function prepareResumeUpload(input: ResumeUploadInput): PreparedResumeUpload {
  const validated = validateResumeUploadMeta({
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });

  return {
    userId: input.userId,
    fileName: sanitizeResumeFileName(validated.fileName),
    mimeType: validated.mimeType,
    byteSize: validated.byteSize,
    storageKey: buildResumeStorageKey(input.userId, validated.fileName),
  };
}

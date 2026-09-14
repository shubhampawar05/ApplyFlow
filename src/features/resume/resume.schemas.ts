import { z } from "zod";

export const RESUME_MAX_BYTES = 10 * 1024 * 1024;

export const allowedResumeMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const resumeUploadMetaSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().positive().max(RESUME_MAX_BYTES),
});

export type ResumeUploadMeta = z.infer<typeof resumeUploadMetaSchema>;

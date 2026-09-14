import { z } from "zod";

export const JOB_SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024;

export const allowedJobScreenshotMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const jobScreenshotUploadMetaSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().positive().max(JOB_SCREENSHOT_MAX_BYTES),
});

export type JobScreenshotUploadMeta = z.infer<typeof jobScreenshotUploadMetaSchema>;

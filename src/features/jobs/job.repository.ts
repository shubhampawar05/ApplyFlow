import { prisma } from "@/lib/prisma";
import type { PreparedJobScreenshotUpload } from "./job-screenshot.types";

export async function createScreenshotJob(upload: PreparedJobScreenshotUpload) {
  return prisma.job.create({
    data: {
      userId: upload.userId,
      sourceType: "SCREENSHOT",
      screenshotStorageKey: upload.storageKey,
    },
    select: {
      id: true,
      screenshotStorageKey: true,
      sourceType: true,
      createdAt: true,
    },
  });
}

// Purpose: Prisma access for job records scoped to user ownership.
// Constraints: always filter by userId; no AI, HTTP, or business-rule logic.
import { prisma } from "@/lib/prisma";
import { jobDraftToUpdateData } from "./job.mapper";
import type { PreparedJobScreenshotUpload } from "./job-screenshot.types";
import type { JobDraftForPersistence } from "./job.types";

export async function getJobForUser(userId: string, jobId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, userId },
  });
}

export async function updateJobFromDraft(jobId: string, draft: JobDraftForPersistence) {
  return prisma.job.update({
    where: { id: jobId },
    data: jobDraftToUpdateData(draft),
  });
}

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

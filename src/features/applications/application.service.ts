// Purpose: orchestrate application intake from screenshots and list queries for the signed-in user.
// Constraints: delegate persistence to application.repository; no HTTP or provider SDK calls.
import { createDraftApplicationForJob, listApplicationsForUser } from "./application.repository";
import { applicationListQuerySchema } from "./application.schemas";
import { createScreenshotJob } from "@/features/jobs/job.repository";
import { prepareJobScreenshotUpload } from "@/features/jobs/job-screenshot.service";
import { uploadPrivateObject } from "@/lib/storage/object-storage";

export async function createApplicationFromScreenshot(
  userId: string,
  file: { name: string; type: string; size: number; bytes: Uint8Array },
) {
  const prepared = prepareJobScreenshotUpload({
    userId,
    fileName: file.name,
    mimeType: file.type,
    byteSize: file.size,
  });

  await uploadPrivateObject({
    key: prepared.storageKey,
    body: file.bytes,
    contentType: prepared.mimeType,
  });

  const job = await createScreenshotJob(prepared);
  const application = await createDraftApplicationForJob(userId, job.id);

  return { job, application, fileName: prepared.fileName };
}

export async function getApplicationsForUser(userId: string, query: unknown) {
  const { limit, status } = applicationListQuerySchema.parse(query ?? {});
  const applications = await listApplicationsForUser(userId, { limit, status });
  return { applications };
}

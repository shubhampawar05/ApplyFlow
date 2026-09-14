import { createDraftApplicationForJob } from "./application.repository";
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

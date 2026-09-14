import { createHash } from "node:crypto";
import { JOB_EXTRACTION_PROMPT_VERSION, extractJobFromScreenshot } from "./job-extraction.adapter";
import { jobDraftToUpdateData, jobRecordToDraftInput } from "./job.mapper";
import { mimeTypeFromStorageKey, toBase64 } from "./job-media";
import { getJobForUser, updateJobFromDraft } from "./job.repository";
import { jobPatchSchema, type JobDraftInput, type JobDraft } from "./job.schemas";
import { prepareJobDraft } from "./job.service";
import { markApplicationAnalyzedForJob } from "@/features/applications/application.repository";
import { completeAiRequest, createAiRequest } from "@/features/ai/ai.repository";
import { downloadPrivateObject } from "@/lib/storage/object-storage";

export class JobExtractionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "JobExtractionError";
    this.code = code;
  }
}

function hashScreenshotInput(storageKey: string) {
  return createHash("sha256").update(storageKey).digest("hex");
}

export async function extractJobForUser(userId: string, jobId: string) {
  const job = await getJobForUser(userId, jobId);
  if (!job) {
    throw new JobExtractionError("NOT_FOUND", "Job not found.");
  }
  if (!job.screenshotStorageKey) {
    throw new JobExtractionError("MISSING_SCREENSHOT", "This job does not have a screenshot to extract.");
  }

  const bytes = await downloadPrivateObject(job.screenshotStorageKey);
  const mimeType = mimeTypeFromStorageKey(job.screenshotStorageKey);
  const inputHash = hashScreenshotInput(job.screenshotStorageKey);

  const aiRequest = await createAiRequest({
    userId,
    kind: "JOB_EXTRACTION",
    promptVersion: JOB_EXTRACTION_PROMPT_VERSION,
    inputHash,
  });

  try {
    const extracted = await extractJobFromScreenshot({
      mimeType,
      imageBase64: toBase64(bytes),
    });
    const draft = prepareJobDraft(extracted);
    const updatedJob = await updateJobFromDraft(job.id, draft);
    const application = await markApplicationAnalyzedForJob(userId, job.id);

    await completeAiRequest(aiRequest.id, {
      status: "SUCCEEDED",
      output: extracted,
    });

    return { job: updatedJob, application };
  } catch (error) {
    await completeAiRequest(aiRequest.id, {
      status: "FAILED",
      errorCode: error instanceof Error ? error.message.slice(0, 120) : "AI_EXTRACT_FAILED",
    });

    if (error instanceof JobExtractionError) throw error;
    throw new JobExtractionError(
      "AI_EXTRACT_FAILED",
      "We could not extract job details from this screenshot. Try again with a clearer image.",
    );
  }
}

export async function updateJobForUser(userId: string, jobId: string, patch: Partial<JobDraft>) {
  const job = await getJobForUser(userId, jobId);
  if (!job) {
    throw new JobExtractionError("NOT_FOUND", "Job not found.");
  }

  const validatedPatch = jobPatchSchema.parse(patch);
  const merged = { ...jobRecordToDraftInput(job), ...validatedPatch };
  const draft = prepareJobDraft(merged);
  return updateJobFromDraft(job.id, draft);
}

// Purpose: orchestrate grounded application email generation and edits for an owned application.
// Constraints: record AI requests; recipient from reviewed job email; never send email from this service.
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  EMAIL_GENERATION_PROMPT_VERSION,
  generateApplicationEmail,
} from "@/features/ai/email-generation.adapter";
import { emailPatchSchema } from "@/features/ai/email-generation.schema";
import { completeAiRequest, createAiRequest } from "@/features/ai/ai.repository";
import { getDefaultResumeWithProfile } from "@/features/resume/resume.repository";
import { parseStoredMatchDetails } from "./application-match.service";
import { toJobMatchInput, toResumeMatchInput } from "./application-match.mapper";
import {
  createSelectedGeneratedEmail,
  getApplicationEmailContext,
  markApplicationReady,
  updateSelectedGeneratedEmail,
} from "./application.repository";

export class ApplicationEmailError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApplicationEmailError";
    this.code = code;
  }
}

function hashEmailInput(applicationId: string, jobId: string, resumeId: string, profileUpdatedAt: Date) {
  return createHash("sha256")
    .update(`email:${applicationId}:${jobId}:${resumeId}:${profileUpdatedAt.toISOString()}`)
    .digest("hex");
}

function isValidRecipientEmail(value: string | null | undefined) {
  return z.string().trim().email().max(320).safeParse(value).success;
}

function getLatestMatchAnalysis(events: Array<{ metadata: unknown }>) {
  const latest = events[0];
  return latest ? parseStoredMatchDetails(latest.metadata) : null;
}

export async function generateApplicationEmailForUser(userId: string, applicationId: string) {
  const application = await getApplicationEmailContext(userId, applicationId);
  if (!application) {
    throw new ApplicationEmailError("NOT_FOUND", "Application not found.");
  }

  if (!isValidRecipientEmail(application.job.applicationEmail)) {
    throw new ApplicationEmailError(
      "MISSING_RECIPIENT",
      "Add a valid application email on the job review form before generating a draft.",
    );
  }

  const resume = application.resume ?? (await getDefaultResumeWithProfile(userId));

  if (!resume) {
    throw new ApplicationEmailError("MISSING_RESUME", "Upload a resume in Settings before generating an email.");
  }

  if (!resume.profile) {
    throw new ApplicationEmailError(
      "MISSING_RESUME_PROFILE",
      "Parse and review your resume profile in Settings before generating an email.",
    );
  }

  const inputHash = hashEmailInput(application.id, application.job.id, resume.id, resume.profile.updatedAt);

  const aiRequest = await createAiRequest({
    userId,
    kind: "EMAIL_GENERATION",
    promptVersion: EMAIL_GENERATION_PROMPT_VERSION,
    inputHash,
  });

  try {
    const draft = await generateApplicationEmail({
      job: toJobMatchInput(application.job),
      resumeProfile: toResumeMatchInput(resume.profile),
      matchAnalysis: getLatestMatchAnalysis(application.events),
    });

    const email = await createSelectedGeneratedEmail({
      applicationId: application.id,
      resumeId: resume.id,
      to: application.job.applicationEmail!,
      subject: draft.subject,
      body: draft.body,
    });

    await completeAiRequest(aiRequest.id, {
      status: "SUCCEEDED",
      output: draft,
    });

    return { application: email.application, email: email.generatedEmail };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "AI_EMAIL_FAILED";
    console.error("Email generation failed", { applicationId, errorCode, error });

    await completeAiRequest(aiRequest.id, {
      status: "FAILED",
      errorCode,
    });

    if (error instanceof ApplicationEmailError) {
      throw error;
    }

    throw new ApplicationEmailError(
      "AI_EMAIL_FAILED",
      "We could not generate the application email right now. Try again in a moment.",
    );
  }
}

export async function updateApplicationEmailForUser(
  userId: string,
  applicationId: string,
  patchInput: unknown,
) {
  const application = await getApplicationEmailContext(userId, applicationId);
  if (!application) {
    throw new ApplicationEmailError("NOT_FOUND", "Application not found.");
  }

  const selectedEmail = application.emails.find((email) => email.isSelected) ?? application.emails[0];
  if (!selectedEmail) {
    throw new ApplicationEmailError("MISSING_EMAIL_DRAFT", "Generate an email draft before editing it.");
  }

  const patch = emailPatchSchema.parse(patchInput);
  const updatedEmail = await updateSelectedGeneratedEmail(application.id, selectedEmail.id, patch);
  const applicationState = await markApplicationReady(application.id);

  return { application: applicationState, email: updatedEmail };
}

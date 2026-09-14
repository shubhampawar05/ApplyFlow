// Purpose: orchestrate resume/job match analysis for an owned application.
// Constraints: record AI requests; require parsed resume profile and reviewed job; delegate OpenAI to resume-matching.adapter.
import { createHash } from "node:crypto";
import { RESUME_MATCHING_PROMPT_VERSION, matchResumeToJob } from "@/features/ai/resume-matching.adapter";
import type { ResumeMatchingOutput } from "@/features/ai/resume-matching.schema";
import { completeAiRequest, createAiRequest } from "@/features/ai/ai.repository";
import { getDefaultResumeWithProfile } from "@/features/resume/resume.repository";
import { toJobMatchInput, toResumeMatchInput } from "./application-match.mapper";
import {
  getApplicationMatchContext,
  saveApplicationMatchResult,
} from "./application.repository";

export class ApplicationMatchError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApplicationMatchError";
    this.code = code;
  }
}

function hashMatchInput(applicationId: string, jobId: string, resumeId: string, profileUpdatedAt: Date) {
  return createHash("sha256")
    .update(`${applicationId}:${jobId}:${resumeId}:${profileUpdatedAt.toISOString()}`)
    .digest("hex");
}

function isJobReadyForMatch(job: { company: string | null; title: string | null; skills: string[]; description: string | null }) {
  return Boolean(job.company || job.title) && Boolean(job.skills.length > 0 || job.description);
}

export async function matchApplicationForUser(userId: string, applicationId: string) {
  const application = await getApplicationMatchContext(userId, applicationId);
  if (!application) {
    throw new ApplicationMatchError("NOT_FOUND", "Application not found.");
  }

  if (!isJobReadyForMatch(application.job)) {
    throw new ApplicationMatchError(
      "JOB_NOT_READY",
      "Review the job title, company, skills, or description before running a match.",
    );
  }

  const resume = application.resume ?? (await getDefaultResumeWithProfile(userId));

  if (!resume) {
    throw new ApplicationMatchError("MISSING_RESUME", "Upload a resume in Settings before running a match.");
  }

  if (!resume.profile) {
    throw new ApplicationMatchError(
      "MISSING_RESUME_PROFILE",
      "Parse and review your resume profile in Settings before running a match.",
    );
  }

  const inputHash = hashMatchInput(application.id, application.job.id, resume.id, resume.profile.updatedAt);

  const aiRequest = await createAiRequest({
    userId,
    kind: "RESUME_MATCHING",
    promptVersion: RESUME_MATCHING_PROMPT_VERSION,
    inputHash,
  });

  try {
    const match = await matchResumeToJob({
      job: toJobMatchInput(application.job),
      resumeProfile: toResumeMatchInput(resume.profile),
    });

    const updatedApplication = await saveApplicationMatchResult(application.id, {
      resumeId: resume.id,
      matchScore: match.score,
      matchDetails: match,
    });

    await completeAiRequest(aiRequest.id, {
      status: "SUCCEEDED",
      output: match,
    });

    return { application: updatedApplication, match };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "AI_MATCH_FAILED";
    console.error("Resume matching failed", { applicationId, errorCode, error });

    await completeAiRequest(aiRequest.id, {
      status: "FAILED",
      errorCode,
    });

    if (error instanceof ApplicationMatchError) {
      throw error;
    }

    throw new ApplicationMatchError(
      "AI_MATCH_FAILED",
      "We could not analyze the resume match right now. Try again in a moment.",
    );
  }
}

export function parseStoredMatchDetails(metadata: unknown): ResumeMatchingOutput | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  if (typeof record.score !== "number" || typeof record.summary !== "string") {
    return null;
  }

  return {
    score: record.score,
    summary: record.summary,
    strengths: Array.isArray(record.strengths) ? record.strengths.filter((item) => typeof item === "string") : [],
    gaps: Array.isArray(record.gaps) ? record.gaps.filter((item) => typeof item === "string") : [],
    matchedSkills: Array.isArray(record.matchedSkills)
      ? record.matchedSkills.filter((item) => typeof item === "string")
      : [],
    missingSkills: Array.isArray(record.missingSkills)
      ? record.missingSkills.filter((item) => typeof item === "string")
      : [],
  };
}

import { createHash } from "node:crypto";
import { RESUME_PARSING_PROMPT_VERSION, parseResumeText } from "@/features/ai/resume-parsing.adapter";
import { completeAiRequest, createAiRequest } from "@/features/ai/ai.repository";
import { resumeProfilePatchSchema, type ResumeProfilePatch } from "@/features/ai/resume-parsing.schema";
import { downloadPrivateObject } from "@/lib/storage/object-storage";
import { toProfileUpsertData } from "./resume-profile.mapper";
import {
  getResumeOwnedByUser,
  getDefaultResumeWithProfile,
  upsertResumeProfile,
  updateResumeProfile,
} from "./resume.repository";
import { extractResumeText, ResumeTextExtractionError } from "./resume-text-extractor";

export class ResumeProfileError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ResumeProfileError";
    this.code = code;
  }
}

function hashResumeInput(storageKey: string, resumeText: string) {
  return createHash("sha256").update(`${storageKey}:${resumeText}`).digest("hex");
}

export async function parseResumeProfileForUser(userId: string, resumeId: string) {
  const resume = await getResumeOwnedByUser(userId, resumeId);
  if (!resume) {
    throw new ResumeProfileError("NOT_FOUND", "Resume not found.");
  }

  const bytes = await downloadPrivateObject(resume.storageKey);
  let resumeText: string;
  try {
    resumeText = await extractResumeText(resume.mimeType, bytes);
  } catch (error) {
    if (error instanceof ResumeTextExtractionError) {
      throw new ResumeProfileError("TEXT_EXTRACTION_ERROR", error.message);
    }
    throw error;
  }

  const inputHash = hashResumeInput(resume.storageKey, resumeText);
  const aiRequest = await createAiRequest({
    userId,
    kind: "RESUME_PARSING",
    promptVersion: RESUME_PARSING_PROMPT_VERSION,
    inputHash,
  });

  try {
    const parsed = await parseResumeText(resumeText);
    const profile = await upsertResumeProfile(resume.id, toProfileUpsertData(parsed));
    await completeAiRequest(aiRequest.id, {
      status: "SUCCEEDED",
      output: parsed,
    });
    return profile;
  } catch (error) {
    await completeAiRequest(aiRequest.id, {
      status: "FAILED",
      errorCode: error instanceof Error ? error.message.slice(0, 120) : "AI_PARSE_FAILED",
    });

    if (error instanceof ResumeProfileError) throw error;
    throw new ResumeProfileError("AI_PARSE_FAILED", "We could not parse this resume. Try again or upload a clearer file.");
  }
}

export async function getDefaultProfileForUser(userId: string) {
  const resume = await getDefaultResumeWithProfile(userId);
  if (!resume) return null;
  return { resume, profile: resume.profile };
}

export async function saveResumeProfileEdits(userId: string, resumeId: string, patch: ResumeProfilePatch) {
  const resume = await getResumeOwnedByUser(userId, resumeId);
  if (!resume) {
    throw new ResumeProfileError("NOT_FOUND", "Resume not found.");
  }

  if (!resume.profile) {
    throw new ResumeProfileError("PROFILE_MISSING", "Parse the resume before reviewing the profile.");
  }

  const validated = resumeProfilePatchSchema.parse(patch);
  return updateResumeProfile(resume.id, validated);
}

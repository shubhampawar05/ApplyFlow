// Purpose: central registry of active AI prompt versions across features.
// Constraints: re-export adapter constants only; no provider or orchestration logic.
import { JOB_EXTRACTION_PROMPT_VERSION } from "@/features/jobs/job-extraction.adapter";
import { RESUME_MATCHING_PROMPT_VERSION } from "./resume-matching.adapter";
import { RESUME_PARSING_PROMPT_VERSION } from "./resume-parsing.adapter";

export const AI_PROMPT_VERSIONS = {
  resumeParsing: RESUME_PARSING_PROMPT_VERSION,
  jobExtraction: JOB_EXTRACTION_PROMPT_VERSION,
  resumeMatching: RESUME_MATCHING_PROMPT_VERSION,
} as const;

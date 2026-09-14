// Purpose: Zod schemas and sanitization for AI resume/job matching output.
// Constraints: score 0-100; bounded list lengths; no orchestration or persistence logic.
import { z } from "zod";

function clampScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeStringList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .map((item) => item.slice(0, maxLength))
    .slice(0, maxItems);
}

export const resumeMatchingOutputSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().trim().min(1).max(1_000),
  strengths: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  gaps: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  matchedSkills: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  missingSkills: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});

export type ResumeMatchingOutput = z.infer<typeof resumeMatchingOutputSchema>;

export function sanitizeResumeMatchingOutput(input: z.input<typeof resumeMatchingOutputSchema>): ResumeMatchingOutput {
  const summary =
    typeof input.summary === "string" && input.summary.trim().length > 0
      ? input.summary.trim().slice(0, 1_000)
      : "Match analysis completed.";

  return resumeMatchingOutputSchema.parse({
    score: clampScore(input.score),
    summary,
    strengths: normalizeStringList(input.strengths, 8, 300),
    gaps: normalizeStringList(input.gaps, 8, 300),
    matchedSkills: normalizeStringList(input.matchedSkills, 20, 100),
    missingSkills: normalizeStringList(input.missingSkills, 20, 100),
  });
}

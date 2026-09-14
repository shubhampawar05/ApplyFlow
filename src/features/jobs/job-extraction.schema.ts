// Purpose: Zod schemas and sanitization for AI job extraction output.
// Constraints: coerce empty strings to null; validate emails and URLs; no orchestration or persistence logic.
import { z } from "zod";

function emptyToNull(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

function coerceOptionalText(value: unknown) {
  const normalized = emptyToNull(value);
  return typeof normalized === "string" ? normalized.trim() : normalized;
}

function coerceEmail(value: unknown) {
  const normalized = coerceOptionalText(value);
  if (typeof normalized !== "string") return null;
  const result = z.string().email().max(320).safeParse(normalized);
  return result.success ? result.data : null;
}

function coerceUrl(value: unknown) {
  const normalized = coerceOptionalText(value);
  if (typeof normalized !== "string") return null;

  let candidate = normalized;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  const result = z.string().url().max(2_000).safeParse(candidate);
  return result.success ? result.data : null;
}

function coerceSkills(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

function coerceDeadline(value: unknown) {
  const normalized = emptyToNull(value);
  if (normalized === null) return null;

  const parsed = new Date(String(normalized));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function coerceConfidence(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(1, Math.max(0, numeric));
}

function coerceOptionalBoundedText(value: unknown, max: number) {
  const normalized = coerceOptionalText(value);
  if (typeof normalized !== "string") return null;
  return normalized.slice(0, max);
}

/**
 * OpenAI structured output only supports a subset of JSON Schema formats.
 * Keep this schema to plain strings/numbers — no .email(), .url(), or .date().
 */
export const jobExtractionModelSchema = z.object({
  company: z.string().nullable(),
  title: z.string().nullable(),
  location: z.string().nullable(),
  employmentType: z.string().nullable(),
  experience: z.string().nullable(),
  skills: z.array(z.string()),
  description: z.string().nullable(),
  salary: z.string().nullable(),
  applicationEmail: z.string().nullable(),
  applicationUrl: z.string().nullable(),
  source: z.string().nullable(),
  deadline: z.string().nullable(),
  confidence: z.number().nullable(),
});

export type JobExtractionModelOutput = z.infer<typeof jobExtractionModelSchema>;

export type JobExtractionOutput = {
  company?: string | null;
  title?: string | null;
  location?: string | null;
  employmentType?: string | null;
  experience?: string | null;
  skills: string[];
  description?: string | null;
  salary?: string | null;
  applicationEmail?: string | null;
  applicationUrl?: string | null;
  source?: string | null;
  deadline?: Date | null;
  confidence?: number | null;
};

export function sanitizeJobExtractionOutput(raw: JobExtractionModelOutput): JobExtractionOutput {
  return {
    company: coerceOptionalBoundedText(raw.company, 160),
    title: coerceOptionalBoundedText(raw.title, 200),
    location: coerceOptionalBoundedText(raw.location, 200),
    employmentType: coerceOptionalBoundedText(raw.employmentType, 80),
    experience: coerceOptionalBoundedText(raw.experience, 160),
    skills: coerceSkills(raw.skills).slice(0, 50).map((skill) => skill.slice(0, 100)),
    description: coerceOptionalBoundedText(raw.description, 5_000),
    salary: coerceOptionalBoundedText(raw.salary, 160),
    applicationEmail: coerceEmail(raw.applicationEmail),
    applicationUrl: coerceUrl(raw.applicationUrl),
    source: coerceOptionalBoundedText(raw.source, 160),
    deadline: coerceDeadline(raw.deadline),
    confidence: coerceConfidence(raw.confidence),
  };
}

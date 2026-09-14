// Purpose: normalize and validate job draft fields before persistence.
// Constraints: deterministic text normalization only; no database, HTTP, or AI calls.
import { jobDraftSchema, type JobDraftInput } from "./job.schemas";
import type { JobDraftForPersistence, NormalizedJobIdentity } from "./job.types";

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");

  return normalized || null;
}

export function normalizeJobIdentity(input: Pick<JobDraftInput, "company" | "title" | "applicationEmail">): NormalizedJobIdentity {
  const parsed = jobDraftSchema.pick({ company: true, title: true, applicationEmail: true }).parse(input);

  return {
    company: normalizeText(parsed.company),
    title: normalizeText(parsed.title),
    applicationEmail: parsed.applicationEmail?.toLocaleLowerCase("en-US") ?? null,
  };
}

export function prepareJobDraft(input: JobDraftInput): JobDraftForPersistence {
  const draft = jobDraftSchema.parse(input);

  return {
    ...draft,
    applicationEmail: draft.applicationEmail?.toLocaleLowerCase("en-US") ?? null,
    normalized: normalizeJobIdentity(draft),
  };
}

export function isLikelyDuplicate(candidate: NormalizedJobIdentity, existing: NormalizedJobIdentity): boolean {
  if (!candidate.company || !candidate.title || !existing.company || !existing.title) return false;
  if (candidate.company !== existing.company || candidate.title !== existing.title) return false;

  return !candidate.applicationEmail || !existing.applicationEmail || candidate.applicationEmail === existing.applicationEmail;
}

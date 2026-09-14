import type { Job } from "@prisma/client";
import type { JobDraftInput } from "./job.schemas";
import type { JobDraftForPersistence } from "./job.types";

export function jobRecordToDraftInput(job: Job): JobDraftInput {
  return {
    company: job.company,
    title: job.title,
    location: job.location,
    employmentType: job.employmentType,
    experience: job.experience,
    skills: job.skills,
    description: job.description,
    salary: job.salary,
    applicationEmail: job.applicationEmail,
    applicationUrl: job.applicationUrl,
    source: job.source,
    deadline: job.deadline,
    confidence: job.extractionConfidence,
  };
}

export function jobDraftToUpdateData(draft: JobDraftForPersistence) {
  return {
    company: draft.company ?? null,
    normalizedCompany: draft.normalized.company,
    title: draft.title ?? null,
    normalizedTitle: draft.normalized.title,
    location: draft.location ?? null,
    employmentType: draft.employmentType ?? null,
    experience: draft.experience ?? null,
    skills: draft.skills,
    description: draft.description ?? null,
    salary: draft.salary ?? null,
    applicationEmail: draft.applicationEmail ?? null,
    normalizedApplicationEmail: draft.normalized.applicationEmail,
    applicationUrl: draft.applicationUrl ?? null,
    source: draft.source ?? null,
    deadline: draft.deadline ?? null,
    extractionConfidence: draft.confidence ?? null,
  };
}

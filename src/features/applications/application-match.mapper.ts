// Purpose: map job and resume records into deterministic match-analysis inputs.
// Constraints: JSON-serializable snapshots only; no provider calls or persistence logic.
import type { Job, ResumeProfile } from "@prisma/client";

export function toJobMatchInput(job: Job) {
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
    deadline: job.deadline?.toISOString() ?? null,
  };
}

export function toResumeMatchInput(profile: ResumeProfile) {
  return {
    fullName: profile.fullName,
    headline: profile.headline,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    content: profile.content,
  };
}

// Purpose: detect likely duplicate applications and block costly flow steps early.
// Constraints: deterministic comparison only; reuse job.service duplicate rules; no Gmail or HTTP logic.
import { isLikelyDuplicate, normalizeJobIdentity } from "@/features/jobs/job.service";
import { getApplicationForUser, listApplicationsForDuplicateCheck } from "./application.repository";

export type DuplicateApplicationSummary = {
  id: string;
  status: string;
  updatedAt: Date;
  job: {
    company: string | null;
    title: string | null;
    applicationEmail: string | null;
  };
};

export class ApplicationDuplicateError extends Error {
  readonly code = "DUPLICATE_BLOCKED";
  readonly duplicates: DuplicateApplicationSummary[];

  constructor(message: string, duplicates: DuplicateApplicationSummary[]) {
    super(message);
    this.name = "ApplicationDuplicateError";
    this.duplicates = duplicates;
  }
}

export function isDuplicateDetectionReady(job: { company: string | null; title: string | null }) {
  return Boolean(job.company && job.title);
}

export function shouldBlockApplicationForDuplicates(input: {
  status: string;
  job: { company: string | null; title: string | null };
  duplicates: DuplicateApplicationSummary[];
}) {
  return (
    input.status !== "SENT" &&
    isDuplicateDetectionReady(input.job) &&
    input.duplicates.length > 0
  );
}

export async function assertApplicationNotDuplicateBlocked(userId: string, applicationId: string) {
  const application = await getApplicationForUser(userId, applicationId);
  if (!application) {
    throw new ApplicationDuplicateError("Application not found.", []);
  }

  if (application.status === "SENT") {
    return;
  }

  if (!isDuplicateDetectionReady(application.job)) {
    return;
  }

  const duplicates = await findLikelyDuplicateApplicationsForUser(userId, applicationId);
  if (duplicates.length === 0) {
    return;
  }

  throw new ApplicationDuplicateError(
    "This application matches a role you already saved or sent. Edit the job details or open the existing application instead.",
    duplicates,
  );
}

export async function findLikelyDuplicateApplicationsForUser(userId: string, applicationId: string) {
  const applications = await listApplicationsForDuplicateCheck(userId, applicationId);
  const current = applications.current;

  if (!current) {
    return [];
  }

  const candidate = normalizeJobIdentity({
    company: current.job.company,
    title: current.job.title,
    applicationEmail: current.job.applicationEmail,
  });

  return applications.others.filter((application) =>
    isLikelyDuplicate(candidate, {
      company: application.job.normalizedCompany,
      title: application.job.normalizedTitle,
      applicationEmail: application.job.normalizedApplicationEmail,
    }),
  ).map((application) => ({
    id: application.id,
    status: application.status,
    updatedAt: application.updatedAt,
    job: {
      company: application.job.company,
      title: application.job.title,
      applicationEmail: application.job.applicationEmail,
    },
  }));
}

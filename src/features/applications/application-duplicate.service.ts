// Purpose: detect likely duplicate applications before send using normalized job identity.
// Constraints: deterministic comparison only; reuse job.service duplicate rules; no Gmail or HTTP logic.
import { isLikelyDuplicate, normalizeJobIdentity } from "@/features/jobs/job.service";
import { listApplicationsForDuplicateCheck } from "./application.repository";

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

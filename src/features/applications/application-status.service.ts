// Purpose: validate and apply user-driven post-send application status changes.
// Constraints: only post-send transitions; record ApplicationEvent; user-scoped access only.
import { ApplicationStatus } from "@prisma/client";
import { applicationStatusPatchSchema, postSendStatuses } from "./application.schemas";
import { getApplicationForUser, updateApplicationStatus } from "./application.repository";

export class ApplicationStatusError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApplicationStatusError";
    this.code = code;
  }
}

const postSendStatusSet = new Set<string>(postSendStatuses);

export async function updateApplicationStatusForUser(
  userId: string,
  applicationId: string,
  body: unknown,
) {
  const patch = applicationStatusPatchSchema.parse(body);
  const application = await getApplicationForUser(userId, applicationId);

  if (!application) {
    throw new ApplicationStatusError("NOT_FOUND", "Application not found.");
  }

  if (!postSendStatusSet.has(application.status)) {
    throw new ApplicationStatusError(
      "STATUS_NOT_EDITABLE",
      "Update the status after the application email has been sent.",
    );
  }

  if (application.status === patch.status) {
    return application;
  }

  return updateApplicationStatus(application.id, {
    fromStatus: application.status,
    toStatus: patch.status as ApplicationStatus,
  });
}

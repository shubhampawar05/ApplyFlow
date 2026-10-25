// Purpose: let the owner reschedule, complete, or clear the follow-up reminder on a sent application.
// Constraints: in-app reminders only; never drafts or sends email; owner-scoped; records ApplicationEvent.
import { followUpActiveStatuses, followUpPatchSchema, isSentOrLater } from "./application.schemas";
import { getApplicationForUser, updateApplicationFollowUp } from "./application.repository";

export class ApplicationFollowUpError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApplicationFollowUpError";
    this.code = code;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const followUpActiveStatusSet = new Set<string>(followUpActiveStatuses);

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// Dates arrive as the user's local calendar date. Allow one day of slack so "today" in any
// time zone ahead of or behind UTC is accepted, while clearly past dates are rejected.
export function isAllowedFollowUpDate(followUpAt: Date, now: Date = new Date()) {
  return followUpAt.getTime() >= startOfUtcDay(now) - DAY_MS;
}

export function isFollowUpDue(
  application: { status: string; followUpAt: Date | null; followUpCompletedAt: Date | null },
  now: Date = new Date(),
) {
  return (
    followUpActiveStatusSet.has(application.status) &&
    application.followUpAt !== null &&
    application.followUpCompletedAt === null &&
    application.followUpAt.getTime() <= now.getTime()
  );
}

export async function updateFollowUpForUser(
  userId: string,
  applicationId: string,
  body: unknown,
  now: Date = new Date(),
) {
  const patch = followUpPatchSchema.parse(body);
  const application = await getApplicationForUser(userId, applicationId);
  if (!application) {
    throw new ApplicationFollowUpError("NOT_FOUND", "Application not found.");
  }

  if (!isSentOrLater(application.status)) {
    throw new ApplicationFollowUpError(
      "FOLLOW_UP_NOT_AVAILABLE",
      "Follow-ups are available after the application email has been sent.",
    );
  }

  if (patch.action === "reschedule") {
    if (!isAllowedFollowUpDate(patch.followUpAt, now)) {
      throw new ApplicationFollowUpError("INVALID_FOLLOW_UP_DATE", "Choose today or a later date.");
    }

    return updateApplicationFollowUp(application.id, {
      data: { followUpAt: patch.followUpAt, followUpCompletedAt: null },
      eventType: "FOLLOW_UP_RESCHEDULED",
      metadata: { followUpAt: patch.followUpAt.toISOString() },
    });
  }

  if (patch.action === "complete") {
    return updateApplicationFollowUp(application.id, {
      data: { followUpCompletedAt: now },
      eventType: "FOLLOW_UP_COMPLETED",
    });
  }

  return updateApplicationFollowUp(application.id, {
    data: { followUpAt: null, followUpCompletedAt: null },
    eventType: "FOLLOW_UP_CLEARED",
  });
}

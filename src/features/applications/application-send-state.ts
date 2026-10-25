// Purpose: derive the send state of an application (in progress vs. outcome unknown) from stored fields.
// Constraints: pure functions only; no persistence, HTTP, or provider calls.

// Longer than any normal Gmail call or route timeout; a claim this old was interrupted.
export const SEND_CLAIM_STALE_AFTER_MS = 2 * 60 * 1000;

export type SendStateFields = {
  status: string;
  sendOutcomeUnknown: boolean;
  sendStartedAt: Date | null;
};

export function isSendOutcomeUnknown(application: SendStateFields, now: Date = new Date()) {
  if (application.status !== "SENDING") {
    return false;
  }

  if (application.sendOutcomeUnknown) {
    return true;
  }

  if (!application.sendStartedAt) {
    return true;
  }

  return now.getTime() - application.sendStartedAt.getTime() > SEND_CLAIM_STALE_AFTER_MS;
}

export function isSendInProgress(application: SendStateFields, now: Date = new Date()) {
  return application.status === "SENDING" && !isSendOutcomeUnknown(application, now);
}

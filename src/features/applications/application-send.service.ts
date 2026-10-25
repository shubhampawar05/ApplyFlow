// Purpose: orchestrate explicit, user-approved application email sending.
// Constraints: verify readiness, recipient, resume, Gmail connection, and confirm flag before send;
// claim READY -> SENDING before Gmail so one request sends; never retry an unknown outcome.
import { z } from "zod";
import { gmailSendRequestSchema } from "@/features/integrations/gmail/gmail.schemas";
import { GmailServiceError, sendGmailMessageForUser } from "@/features/integrations/gmail/gmail.service";
import { downloadPrivateObject } from "@/lib/storage/object-storage";
import { findLikelyDuplicateApplicationsForUser } from "./application-duplicate.service";
import { isSentOrLater } from "./application.schemas";
import { isSendOutcomeUnknown } from "./application-send-state";
import {
  claimApplicationForSend,
  getApplicationSendContext,
  markSendOutcomeUnknown,
  recordSuccessfulEmailDelivery,
  releaseSendClaim,
  resolveUnknownSendOutcome,
} from "./application.repository";

export class ApplicationSendError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApplicationSendError";
    this.code = code;
    this.details = details;
  }
}

const SEND_OUTCOME_UNKNOWN_MESSAGE =
  "We could not confirm whether this email was sent. Check your Gmail Sent folder, then tell ApplyFlow whether it went out.";

function sendBlockedByStatus(application: {
  status: string;
  sendOutcomeUnknown: boolean;
  sendStartedAt: Date | null;
}) {
  if (application.status === "SENDING") {
    return isSendOutcomeUnknown(application)
      ? new ApplicationSendError("SEND_OUTCOME_UNKNOWN", SEND_OUTCOME_UNKNOWN_MESSAGE)
      : new ApplicationSendError("SEND_IN_PROGRESS", "This application email is already being sent.");
  }

  if (isSentOrLater(application.status)) {
    return new ApplicationSendError("ALREADY_SENT", "This application email has already been sent.");
  }

  if (application.status !== "READY") {
    return new ApplicationSendError(
      "NOT_READY",
      "Generate and save an email draft before sending this application.",
    );
  }

  return null;
}

function isValidRecipientEmail(value: string | null | undefined) {
  return z.string().trim().email().max(320).safeParse(value).success;
}

export async function sendApplicationEmailForUser(
  userId: string,
  applicationId: string,
  body: unknown,
) {
  const request = gmailSendRequestSchema.parse(body);
  if (!request.confirm) {
    throw new ApplicationSendError("CONFIRMATION_REQUIRED", "Explicit send confirmation is required.");
  }

  const application = await getApplicationSendContext(userId, applicationId);
  if (!application) {
    throw new ApplicationSendError("NOT_FOUND", "Application not found.");
  }

  const statusError = sendBlockedByStatus(application);
  if (statusError) {
    throw statusError;
  }

  if (!application.resumeId || !application.resume) {
    throw new ApplicationSendError("MISSING_RESUME", "Select a resume before sending this application.");
  }

  let resumeAttachment: { fileName: string; mimeType: string; content: Uint8Array };
  try {
    const content = await downloadPrivateObject(application.resume.storageKey);
    resumeAttachment = {
      fileName: application.resume.fileName,
      mimeType: application.resume.mimeType,
      content,
    };
  } catch (error) {
    console.error("Resume attachment load failed", {
      applicationId: application.id,
      resumeId: application.resume.id,
      error,
    });
    throw new ApplicationSendError(
      "RESUME_ATTACHMENT_FAILED",
      "We could not load your resume file for sending. Re-upload it in Settings and try again.",
    );
  }

  const selectedEmail = application.emails.find((email) => email.isSelected) ?? application.emails[0];
  if (!selectedEmail) {
    throw new ApplicationSendError("MISSING_EMAIL_DRAFT", "Generate an email draft before sending.");
  }

  if (!isValidRecipientEmail(selectedEmail.to) || !isValidRecipientEmail(application.job.applicationEmail)) {
    throw new ApplicationSendError("INVALID_RECIPIENT", "The application email recipient is invalid.");
  }

  if (selectedEmail.to.trim().toLowerCase() !== application.job.applicationEmail!.trim().toLowerCase()) {
    throw new ApplicationSendError(
      "RECIPIENT_MISMATCH",
      "The draft recipient must match the reviewed application email before sending.",
    );
  }

  const duplicates = await findLikelyDuplicateApplicationsForUser(userId, application.id);
  if (duplicates.length > 0 && !request.acknowledgeDuplicate) {
    throw new ApplicationSendError(
      "DUPLICATE_WARNING",
      "This application looks similar to a recent one. Review the duplicate warning and confirm before sending.",
      { duplicates },
    );
  }

  const claim = await claimApplicationForSend(userId, application.id);
  if (!claim.claimed) {
    throw (
      sendBlockedByStatus({
        status: claim.status ?? "READY",
        sendOutcomeUnknown: claim.sendOutcomeUnknown,
        sendStartedAt: claim.sendStartedAt,
      }) ?? new ApplicationSendError("SEND_IN_PROGRESS", "This application email is already being sent.")
    );
  }

  let delivery: { providerMessageId: string };
  try {
    delivery = await sendGmailMessageForUser(userId, {
      to: selectedEmail.to,
      subject: selectedEmail.subject,
      body: selectedEmail.body,
      attachment: resumeAttachment,
    });
  } catch (error) {
    if (error instanceof GmailServiceError && error.code === "GMAIL_SEND_UNKNOWN") {
      await markSendOutcomeUnknown(application.id);
      throw new ApplicationSendError("SEND_OUTCOME_UNKNOWN", SEND_OUTCOME_UNKNOWN_MESSAGE);
    }

    // Everything else fails before or is a definite rejection by Gmail, so the claim can be released.
    await releaseSendClaim(application.id);

    if (error instanceof GmailServiceError) {
      throw new ApplicationSendError(error.code, error.message);
    }

    console.error("Gmail send preparation failed", { applicationId: application.id });
    throw new ApplicationSendError(
      "GMAIL_SEND_FAILED",
      "Gmail could not send this email right now. Your draft is still saved.",
    );
  }

  try {
    return await recordSuccessfulEmailDelivery({
      applicationId: application.id,
      generatedEmailId: selectedEmail.id,
      recipient: selectedEmail.to,
      providerMessageId: delivery.providerMessageId,
    });
  } catch {
    console.error("Recording email delivery failed after Gmail send", { applicationId: application.id });
    try {
      await markSendOutcomeUnknown(application.id);
    } catch {
      // The stale-claim rule still surfaces this application as an unknown outcome.
    }
    throw new ApplicationSendError("SEND_OUTCOME_UNKNOWN", SEND_OUTCOME_UNKNOWN_MESSAGE);
  }
}

const sendOutcomeResolutionSchema = z.object({ sent: z.boolean() }).strict();

export async function resolveSendOutcomeForUser(userId: string, applicationId: string, body: unknown) {
  const request = sendOutcomeResolutionSchema.parse(body);
  const application = await getApplicationSendContext(userId, applicationId);
  if (!application) {
    throw new ApplicationSendError("NOT_FOUND", "Application not found.");
  }

  if (!isSendOutcomeUnknown(application)) {
    throw new ApplicationSendError(
      "NOT_RESOLVABLE",
      "This application does not have an unconfirmed send to resolve.",
    );
  }

  const resolved = await resolveUnknownSendOutcome(application.id, { sent: request.sent });
  if (!resolved) {
    throw new ApplicationSendError(
      "NOT_RESOLVABLE",
      "This application does not have an unconfirmed send to resolve.",
    );
  }

  return { application: resolved };
}

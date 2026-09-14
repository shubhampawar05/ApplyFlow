// Purpose: orchestrate explicit, user-approved application email sending.
// Constraints: verify readiness, recipient, resume, Gmail connection, and confirm flag before send.
import { z } from "zod";
import { gmailSendRequestSchema } from "@/features/integrations/gmail/gmail.schemas";
import { GmailServiceError, sendGmailMessageForUser } from "@/features/integrations/gmail/gmail.service";
import { findLikelyDuplicateApplicationsForUser } from "./application-duplicate.service";
import {
  getApplicationSendContext,
  recordSuccessfulEmailDelivery,
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

  if (application.status === "SENT") {
    throw new ApplicationSendError("ALREADY_SENT", "This application email has already been sent.");
  }

  if (application.status !== "READY") {
    throw new ApplicationSendError(
      "NOT_READY",
      "Generate and save an email draft before sending this application.",
    );
  }

  if (!application.resumeId) {
    throw new ApplicationSendError("MISSING_RESUME", "Select a resume before sending this application.");
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

  try {
    const delivery = await sendGmailMessageForUser(userId, {
      to: selectedEmail.to,
      subject: selectedEmail.subject,
      body: selectedEmail.body,
    });

    const result = await recordSuccessfulEmailDelivery({
      applicationId: application.id,
      generatedEmailId: selectedEmail.id,
      recipient: selectedEmail.to,
      providerMessageId: delivery.providerMessageId,
    });

    return result;
  } catch (error) {
    if (error instanceof GmailServiceError) {
      throw new ApplicationSendError(error.code, error.message);
    }

    if (error instanceof ApplicationSendError) {
      throw error;
    }

    throw new ApplicationSendError(
      "GMAIL_SEND_FAILED",
      "Gmail could not send this email right now. Your draft is still saved.",
    );
  }
}

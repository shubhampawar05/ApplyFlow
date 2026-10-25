// Purpose: POST endpoint to send an approved application email through Gmail.
// Constraints: authenticate user; require explicit confirm flag; follow docs/07-API.md.
import {
  ApplicationSendError,
  sendApplicationEmailForUser,
} from "@/features/applications/application-send.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

function sendErrorStatus(code: string) {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "DUPLICATE_WARNING":
    case "SEND_IN_PROGRESS":
    case "SEND_OUTCOME_UNKNOWN":
    case "ALREADY_SENT":
      return 409;
    case "GMAIL_SEND_FAILED":
    case "GMAIL_SEND_REJECTED":
      return 502;
    default:
      return 400;
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Expected JSON body.", 400);
  }

  try {
    const result = await sendApplicationEmailForUser(user.id, id, body);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("CONFIRMATION_REQUIRED", "Explicit send confirmation is required.", 400, error.flatten());
    }

    if (error instanceof ApplicationSendError) {
      const status = sendErrorStatus(error.code);
      return apiError(error.code, error.message, status, error.details);
    }

    console.error("Application send failed", error);
    return apiError(
      "GMAIL_SEND_FAILED",
      "Gmail could not send this email right now. Your draft is still saved.",
      502,
    );
  }
}

// Purpose: POST endpoint for the user to resolve an application whose send outcome is unknown.
// Constraints: authenticate user; owner-scoped; never calls Gmail; follow docs/07-API.md.
import {
  ApplicationSendError,
  resolveSendOutcomeForUser,
} from "@/features/applications/application-send.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

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
    const result = await resolveSendOutcomeForUser(user.id, id, body);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Expected { sent: true | false }.", 400, error.flatten());
    }

    if (error instanceof ApplicationSendError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return apiError(error.code, error.message, status);
    }

    console.error("Send outcome resolution failed", { applicationId: id });
    return apiError("SEND_OUTCOME_UPDATE_FAILED", "We could not update this application. Try again.", 500);
  }
}

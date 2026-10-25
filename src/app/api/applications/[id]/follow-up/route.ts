// Purpose: PATCH endpoint to reschedule, complete, or clear an application's follow-up reminder.
// Constraints: authenticate user; owner-scoped; reminders only, never sends email; follow docs/07-API.md.
import {
  ApplicationFollowUpError,
  updateFollowUpForUser,
} from "@/features/applications/application-follow-up.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
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
    const application = await updateFollowUpForUser(user.id, id, body);
    return apiSuccess({ application });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Invalid follow-up update.", 400, error.flatten());
    }

    if (error instanceof ApplicationFollowUpError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FOLLOW_UP_NOT_AVAILABLE" ? 409 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Follow-up update failed", { applicationId: id });
    return apiError("FOLLOW_UP_UPDATE_FAILED", "We could not update the follow-up. Try again.", 500);
  }
}

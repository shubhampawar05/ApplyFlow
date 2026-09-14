// Purpose: PATCH endpoint to update post-send application status.
// Constraints: authenticate user; validate body; follow docs/07-API.md and docs/11-USER-FLOWS.md.
import {
  ApplicationStatusError,
  updateApplicationStatusForUser,
} from "@/features/applications/application-status.service";
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
    const application = await updateApplicationStatusForUser(user.id, id, body);
    return apiSuccess({ application });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Invalid status update.", 400, error.flatten());
    }

    if (error instanceof ApplicationStatusError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Application status update failed", error);
    return apiError("STATUS_UPDATE_FAILED", "We could not update the application status.", 500);
  }
}

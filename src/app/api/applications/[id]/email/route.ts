// Purpose: PATCH endpoint to edit the selected application email draft.
// Constraints: authenticate user; thin handler delegating to application-email.service; follow docs/07-API.md.
import {
  ApplicationEmailError,
  updateApplicationEmailForUser,
} from "@/features/applications/application-email.service";
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
    const result = await updateApplicationEmailForUser(user.id, id, body);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Invalid email update payload.", 400, error.flatten());
    }

    if (error instanceof ApplicationEmailError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Email update failed", error);
    return apiError("EMAIL_UPDATE_FAILED", "We could not save your email changes.", 500);
  }
}

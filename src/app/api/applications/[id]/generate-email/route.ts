// Purpose: POST endpoint to generate a grounded application email draft.
// Constraints: authenticate user; thin handler delegating to application-email.service; follow docs/07-API.md.
import {
  ApplicationEmailError,
  generateApplicationEmailForUser,
} from "@/features/applications/application-email.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { apiError, apiSuccess } from "@/lib/api/responses";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const { id } = await context.params;

  try {
    const result = await generateApplicationEmailForUser(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ApplicationEmailError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "AI_EMAIL_FAILED" ? 500 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Email generation failed", error);
    return apiError(
      "AI_EMAIL_FAILED",
      "We could not generate the application email right now. Try again in a moment.",
      500,
    );
  }
}

// Purpose: POST endpoint to analyze resume/job fit for an application.
// Constraints: authenticate user; thin handler delegating to application-match.service; follow docs/07-API.md.
import {
  ApplicationMatchError,
  matchApplicationForUser,
} from "@/features/applications/application-match.service";
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
    const result = await matchApplicationForUser(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ApplicationMatchError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "AI_MATCH_FAILED" ? 500 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Application match failed", error);
    return apiError(
      "AI_MATCH_FAILED",
      "We could not analyze the resume match right now. Try again in a moment.",
      500,
    );
  }
}

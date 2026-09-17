// Purpose: POST endpoint to skip resume match analysis and advance the application flow.
// Constraints: authenticate user; thin handler delegating to application-match.service; follow docs/07-API.md.
import {
  ApplicationMatchError,
  skipApplicationMatchForUser,
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
    const result = await skipApplicationMatchForUser(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ApplicationMatchError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "DUPLICATE_BLOCKED" ? 409 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Application match skip failed", error);
    return apiError("MATCH_SKIP_FAILED", "We could not skip this step right now. Try again.", 500);
  }
}

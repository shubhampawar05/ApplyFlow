// Purpose: POST endpoint to parse a resume into a structured profile via AI.
// Constraints: authenticate user; verify resume ownership; delegate to resume-profile.service.
import { parseResumeProfileForUser, ResumeProfileError } from "@/features/resume/resume-profile.service";
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
    const profile = await parseResumeProfileForUser(user.id, id);
    return apiSuccess({ profile });
  } catch (error) {
    if (error instanceof ResumeProfileError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Resume parsing failed", error);
    return apiError("AI_PARSE_FAILED", "We could not parse this resume. Try again or upload a clearer file.", 500);
  }
}

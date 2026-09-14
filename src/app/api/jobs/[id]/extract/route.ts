import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { extractJobForUser, JobExtractionError } from "@/features/jobs/job-extraction.service";
import { apiError, apiSuccess } from "@/lib/api/responses";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const { id } = await context.params;

  try {
    const result = await extractJobForUser(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof JobExtractionError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Job extraction failed", error);
    return apiError(
      "AI_EXTRACT_FAILED",
      "We could not extract job details from this screenshot. Try again with a clearer image.",
      500,
    );
  }
}

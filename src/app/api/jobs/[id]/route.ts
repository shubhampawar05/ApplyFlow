import { ZodError } from "zod";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { JobExtractionError, updateJobForUser } from "@/features/jobs/job-extraction.service";
import { apiError, apiSuccess } from "@/lib/api/responses";

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
    const job = await updateJobForUser(user.id, id, body as never);
    return apiSuccess({ job });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Check the job fields and try again.", 400);
    }
    if (error instanceof JobExtractionError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Job update failed", error);
    return apiError("INTERNAL_ERROR", "We could not save your job changes.", 500);
  }
}

import { ZodError } from "zod";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import type { ResumeProfilePatch } from "@/features/ai/resume-parsing.schema";
import { saveResumeProfileEdits, ResumeProfileError } from "@/features/resume/resume-profile.service";
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
    const profile = await saveResumeProfileEdits(user.id, id, body as ResumeProfilePatch);
    return apiSuccess({ profile });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Check the profile fields and try again.", 400);
    }
    if (error instanceof ResumeProfileError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(error.code, error.message, status);
    }

    console.error("Resume profile update failed", error);
    return apiError("INTERNAL_ERROR", "We could not save your profile changes.", 500);
  }
}

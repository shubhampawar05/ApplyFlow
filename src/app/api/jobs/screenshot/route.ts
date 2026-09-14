// Purpose: POST endpoint to upload a job screenshot and create a draft application.
// Constraints: authenticate user; validate upload; delegate to application and job-screenshot services.
import { ZodError } from "zod";
import { createApplicationFromScreenshot } from "@/features/applications/application.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { JobScreenshotValidationError } from "@/features/jobs/job-screenshot.service";
import { apiError, apiSuccess } from "@/lib/api/responses";

export async function POST(request: Request) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("VALIDATION_ERROR", "Expected multipart form data with a screenshot file.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_ERROR", "Choose a job screenshot to upload.", 400);
  }

  try {
    const result = await createApplicationFromScreenshot(user.id, {
      name: file.name,
      type: file.type,
      size: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });

    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof JobScreenshotValidationError || error instanceof ZodError) {
      return apiError(
        "VALIDATION_ERROR",
        error instanceof JobScreenshotValidationError ? error.message : "Invalid screenshot upload.",
        400,
      );
    }

    console.error("Job screenshot intake failed", error);
    return apiError("STORAGE_ERROR", "We could not save this screenshot. Check storage configuration and try again.", 500);
  }
}

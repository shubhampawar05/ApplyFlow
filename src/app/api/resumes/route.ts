// Purpose: POST endpoint to upload a resume and set it as the user's default.
// Constraints: authenticate user; validate upload; delegate to resume services; follow docs/07-API.md.
import { ZodError } from "zod";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { createResumeAsDefault } from "@/features/resume/resume.repository";
import { prepareResumeUpload, ResumeValidationError } from "@/features/resume/resume.service";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { uploadPrivateObject } from "@/lib/storage/object-storage";

export async function POST(request: Request) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("VALIDATION_ERROR", "Expected multipart form data with a resume file.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_ERROR", "Choose a resume file to upload.", 400);
  }

  try {
    const prepared = prepareResumeUpload({
      userId: user.id,
      fileName: file.name,
      mimeType: file.type,
      byteSize: file.size,
    });

    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadPrivateObject({
      key: prepared.storageKey,
      body: bytes,
      contentType: prepared.mimeType,
    });

    const resume = await createResumeAsDefault(prepared);
    return apiSuccess({ resume }, 201);
  } catch (error) {
    if (error instanceof ResumeValidationError || error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", error instanceof ResumeValidationError ? error.message : "Invalid resume upload.", 400);
    }

    console.error("Resume upload failed", error);
    return apiError("STORAGE_ERROR", "We could not store your resume. Check storage configuration and try again.", 500);
  }
}

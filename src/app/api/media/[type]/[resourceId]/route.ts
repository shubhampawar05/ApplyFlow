// Purpose: GET endpoint to stream auth-scoped private files for in-app previews.
// Constraints: authenticate user; validate params; delegate to media.service; follow docs/09-SECURITY.md.
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { getPrivateMediaForUser, MediaAccessError } from "@/features/media/media.service";
import { mediaTypeSchema } from "@/features/media/media.schemas";
import { apiError } from "@/lib/api/responses";

type RouteContext = { params: Promise<{ type: string; resourceId: string }> };

function sanitizeContentDispositionFileName(fileName: string) {
  return fileName.replace(/[\r\n"]/g, "").trim() || "file";
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const { type, resourceId } = await context.params;
  const parsedType = mediaTypeSchema.safeParse(type);
  if (!parsedType.success || !resourceId) {
    return apiError("VALIDATION_ERROR", "Invalid media request.", 400);
  }

  try {
    const media = await getPrivateMediaForUser(user.id, parsedType.data, resourceId);
    const fileName = sanitizeContentDispositionFileName(media.fileName);

    return new Response(media.bytes, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof MediaAccessError) {
      const status = error.code === "NOT_FOUND" ? 404 : 500;
      return apiError(error.code, error.message, status);
    }

    console.error("Private media fetch failed", error);
    return apiError("MEDIA_FETCH_FAILED", "We could not load this file.", 500);
  }
}

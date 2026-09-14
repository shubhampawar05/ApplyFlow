// Purpose: GET endpoint to list the signed-in user's applications.
// Constraints: authenticate user; validate query params; follow docs/07-API.md.
import { getApplicationsForUser } from "@/features/applications/application.service";
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { ZodError } from "zod";

export async function GET(request: Request) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const requestUrl = new URL(request.url);
  const query = {
    limit: requestUrl.searchParams.get("limit"),
    status: requestUrl.searchParams.get("status"),
  };

  try {
    const result = await getApplicationsForUser(user.id, query);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Invalid applications query.", 400, error.flatten());
    }

    console.error("List applications failed", error);
    return apiError("LIST_APPLICATIONS_FAILED", "We could not load your applications.", 500);
  }
}

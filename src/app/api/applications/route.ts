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
  const param = (name: string) => requestUrl.searchParams.get(name) ?? undefined;
  const query = {
    limit: param("limit"),
    status: param("status"),
    q: param("q"),
    sort: param("sort"),
    view: param("view"),
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

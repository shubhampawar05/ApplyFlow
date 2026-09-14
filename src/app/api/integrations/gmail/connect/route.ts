// Purpose: start Gmail OAuth by redirecting the signed-in user to Google.
// Constraints: authenticate user; no token handling in route; follow docs/09-SECURITY.md.
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { safeNextPath } from "@/features/auth/auth.paths";
import { getGmailConnectUrl, GmailServiceError } from "@/features/integrations/gmail/gmail.service";
import { apiError } from "@/lib/api/responses";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const requestUrl = new URL(request.url);
  const returnTo = safeNextPath(requestUrl.searchParams.get("returnTo")) ?? "/settings";

  try {
    const connectUrl = getGmailConnectUrl(user.id, returnTo);
    return NextResponse.redirect(connectUrl);
  } catch (error) {
    if (error instanceof GmailServiceError) {
      return apiError(error.code, error.message, 500);
    }

    console.error("Gmail connect failed", error);
    return apiError("GMAIL_CONNECT_FAILED", "Gmail integration is not configured.", 500);
  }
}

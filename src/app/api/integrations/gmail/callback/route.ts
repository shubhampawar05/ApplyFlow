// Purpose: complete Gmail OAuth and store encrypted tokens for the signed-in user.
// Constraints: validate signed OAuth state; redirect back to app; no token logging.
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { safeNextPath } from "@/features/auth/auth.paths";
import { parseGmailOAuthState } from "@/features/integrations/gmail/gmail-oauth-state";
import { completeGmailOAuthForUser } from "@/features/integrations/gmail/gmail.service";
import { NextResponse } from "next/server";

function redirectTo(origin: string, path: string) {
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    return redirectTo(origin, "/settings?gmail=denied");
  }

  if (!code || !state) {
    return redirectTo(origin, "/settings?gmail=error");
  }

  const user = await getApiCurrentUser();
  if (!user) {
    return redirectTo(origin, "/login?next=/settings");
  }

  try {
    const parsedState = parseGmailOAuthState(state);
    if (parsedState.userId !== user.id) {
      return redirectTo(origin, "/settings?gmail=error");
    }

    await completeGmailOAuthForUser(user.id, code);
    const returnTo = safeNextPath(parsedState.returnTo) ?? "/settings";
    const separator = returnTo.includes("?") ? "&" : "?";
    return redirectTo(origin, `${returnTo}${separator}gmail=connected`);
  } catch (error) {
    console.error("Gmail OAuth callback failed", error);
    return redirectTo(origin, "/settings?gmail=error");
  }
}

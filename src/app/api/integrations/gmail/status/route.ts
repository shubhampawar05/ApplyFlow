// Purpose: return whether the signed-in user has connected Gmail for sending.
// Constraints: authenticate user; never return tokens or secrets.
import { getApiCurrentUser } from "@/features/auth/get-api-current-user";
import { getGmailConnectionStatus } from "@/features/integrations/gmail/gmail.service";
import { apiError, apiSuccess } from "@/lib/api/responses";

export async function GET() {
  const user = await getApiCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Sign in required.", 401);
  }

  const status = await getGmailConnectionStatus(user.id);
  return apiSuccess(status);
}

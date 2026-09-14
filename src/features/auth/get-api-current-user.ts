// Purpose: resolve the current user for API route handlers.
// Constraints: return null when unauthenticated; no redirects; delegate parsing to auth.service.
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { identityFromClaims } from "./auth.service";
import { syncAppUser } from "./auth.repository";

export async function getApiCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const identity = data?.claims ? identityFromClaims(data.claims) : null;

  if (error || !identity) {
    return null;
  }

  return syncAppUser(identity);
}

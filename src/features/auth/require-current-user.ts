import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { identityFromClaims } from "./auth.service";
import { syncAppUser } from "./auth.repository";
import { loginPathWithNext } from "./auth.paths";

export async function requireCurrentUser(nextPath = "/dashboard") {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const identity = data?.claims ? identityFromClaims(data.claims) : null;

  if (error || !identity) {
    redirect(loginPathWithNext(nextPath));
  }

  return syncAppUser(identity);
}

import { NextResponse } from "next/server";
import { identityFromClaims } from "@/features/auth/auth.service";
import { syncAppUser } from "@/features/auth/auth.repository";
import { DEFAULT_POST_LOGIN_PATH, safeNextPath } from "@/features/auth/auth.paths";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

function redirectTo(origin: string, path: string) {
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;

  if (!code) {
    return redirectTo(origin, "/auth/error?reason=missing-code");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectTo(origin, "/auth/error?reason=exchange-failed");
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const identity = data?.claims ? identityFromClaims(data.claims) : null;

  if (claimsError || !identity) {
    return redirectTo(origin, "/auth/error?reason=missing-email");
  }

  await syncAppUser(identity);
  return redirectTo(origin, next || DEFAULT_POST_LOGIN_PATH);
}

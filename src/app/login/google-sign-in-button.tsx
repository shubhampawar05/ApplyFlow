"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { safeNextPath } from "@/features/auth/auth.paths";

export function GoogleSignInButton({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setError(undefined);
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const next = safeNextPath(nextPath);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (oauthError) {
      setPending(false);
      setError("Google sign-in could not start. Check that Supabase Auth is configured, then try again.");
    }
  }

  return (
    <div>
      <button className="button" disabled={pending} onClick={handleClick} type="button">
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error ? (
        <p className="upload-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

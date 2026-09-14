"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResumeParseButton({ resumeId, hasProfile }: { resumeId: string; hasProfile: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleParse() {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/parse`, { method: "POST" });
      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? "We could not parse this resume. Try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("We could not parse this resume. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="button secondary" disabled={pending} onClick={handleParse} type="button">
        {pending ? "Parsing resume…" : hasProfile ? "Re-parse resume" : "Parse resume"}
      </button>
      {error ? (
        <p className="upload-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

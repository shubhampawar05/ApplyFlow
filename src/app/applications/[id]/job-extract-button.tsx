"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JobExtractButton({ jobId, hasExtractedFields }: { jobId: string; hasExtractedFields: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleExtract() {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/jobs/${jobId}/extract`, { method: "POST" });
      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(payload.error?.message ?? "We could not extract job details. Try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("We could not extract job details. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="button secondary" disabled={pending} onClick={handleExtract} type="button">
        {pending ? "Extracting job details…" : hasExtractedFields ? "Re-extract from screenshot" : "Extract job details"}
      </button>
      {error ? (
        <p className="upload-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

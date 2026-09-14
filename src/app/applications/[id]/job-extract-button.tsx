"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiProcessingBanner } from "@/components/ai-processing-banner";
import { Button } from "@/components/button";
import { ErrorRecoveryHint } from "@/components/error-recovery-hint";

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
      {pending ? <AiProcessingBanner message="Reading your screenshot and extracting job details…" /> : null}
      <Button loading={pending} onClick={handleExtract} type="button" variant="secondary">
        {hasExtractedFields ? "Re-extract from screenshot" : "Extract job details"}
      </Button>
      {error ? (
        <>
          <p className="upload-error" role="alert">
            {error}
          </p>
          <ErrorRecoveryHint href="/applications/new" linkLabel="Upload a clearer screenshot">
            Try a screenshot with the job title and application email clearly visible.
          </ErrorRecoveryHint>
        </>
      ) : null}
    </div>
  );
}

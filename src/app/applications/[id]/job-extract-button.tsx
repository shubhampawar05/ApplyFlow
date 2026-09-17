"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiProcessingBanner } from "@/components/ai-processing-banner";
import { Button } from "@/components/button";
import { ErrorRecoveryHint } from "@/components/error-recovery-hint";
import { useToast } from "@/components/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";

export function JobExtractButton({ jobId, hasExtractedFields }: { jobId: string; hasExtractedFields: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleExtract() {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/jobs/${jobId}/extract`, { method: "POST" });
      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        const message = getApiErrorMessage(payload, "We could not extract job details. Try again.");
        setError(message);
        showToast(message, "error");
        return;
      }

      showToast("Job details extracted.");
      router.refresh();
    } catch {
      const message = "We could not extract job details. Try again.";
      setError(message);
      showToast(message, "error");
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

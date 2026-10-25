"use client";

// Purpose: let the user resolve a send whose outcome is unknown, or wait for one in progress.
// Constraints: never sends email; only calls the owner-scoped send-outcome endpoint after a user action.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { useToast } from "@/components/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";

export function ApplicationSendOutcomeBanner({
  applicationId,
  outcomeUnknown,
}: {
  applicationId: string;
  outcomeUnknown: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState<"sent" | "not-sent" | null>(null);
  const [error, setError] = useState<string>();

  if (!outcomeUnknown) {
    return (
      <div className="send-outcome-banner" role="status">
        <p className="send-outcome-title">This email is being sent.</p>
        <p>Refresh in a moment to see the result. Sending is locked until it finishes.</p>
        <Button onClick={() => router.refresh()} type="button" variant="secondary">
          Refresh
        </Button>
      </div>
    );
  }

  async function resolve(sent: boolean) {
    setPending(sent ? "sent" : "not-sent");
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/send-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sent }),
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        setError(getApiErrorMessage(payload, "We could not update this application. Try again."));
        return;
      }

      showToast(sent ? "Marked as sent" : "Marked as not sent. You can send again when ready.");
      router.refresh();
    } catch {
      setError("We could not update this application. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="send-outcome-banner attention" role="alert">
      <p className="send-outcome-title">We couldn't confirm whether this email was sent.</p>
      <p>
        Check the Sent folder in Gmail for this message, then tell ApplyFlow what happened. Sending again is locked
        until you do, so the recruiter never gets the email twice.
      </p>
      <div className="send-outcome-actions">
        <Button loading={pending === "sent"} disabled={pending !== null} onClick={() => resolve(true)} type="button">
          It was sent
        </Button>
        <Button
          disabled={pending !== null}
          loading={pending === "not-sent"}
          onClick={() => resolve(false)}
          type="button"
          variant="secondary"
        >
          It was not sent
        </Button>
      </div>
      {error ? (
        <p className="upload-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

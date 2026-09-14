"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statusOptions = [
  { value: "FOLLOW_UP", label: "Follow up" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CLOSED", label: "Closed" },
] as const;

export function ApplicationStatusPanel({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState(currentStatus);

  const editable = ["SENT", "FOLLOW_UP", "INTERVIEW", "REJECTED", "OFFER", "CLOSED"].includes(currentStatus);

  if (!editable) {
    return null;
  }

  async function handleStatusChange(nextStatus: string) {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setError(payload.error?.message ?? "We could not update the application status.");
        return;
      }

      setStatus(nextStatus);
      router.refresh();
    } catch {
      setError("We could not update the application status.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="settings-section">
      <p className="section-label">Application status</p>
      <div className="resume-card">
        <p className="resume-card-title">
          Current status: <strong>{status.replaceAll("_", " ")}</strong>
        </p>
        <p className="quiet-note">Track follow-ups, interviews, and outcomes after the email is sent.</p>
        <div className="status-actions">
          {statusOptions.map((option) => (
            <button
              className={`button secondary ${status === option.value ? "active-status" : ""}`}
              disabled={pending || status === option.value}
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        {error ? (
          <p className="upload-error" role="alert">{error}</p>
        ) : null}
      </div>
    </section>
  );
}

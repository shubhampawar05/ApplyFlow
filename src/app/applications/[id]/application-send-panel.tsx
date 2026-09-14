"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApplicationSendPanel({
  applicationId,
  canSend,
  blockReason,
  gmailConnected,
  applicationStatus,
}: {
  applicationId: string;
  canSend: boolean;
  blockReason?: string;
  gmailConnected: boolean;
  applicationStatus: string;
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(applicationStatus === "SENT");

  async function handleSend() {
    if (!confirmed) {
      setError("Check the confirmation box before sending.");
      return;
    }

    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setError(payload.error?.message ?? "Gmail could not send this email. Your draft is still saved.");
        return;
      }

      setSent(true);
      router.refresh();
    } catch {
      setError("Gmail could not send this email. Your draft is still saved.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <section className="settings-section">
        <p className="section-label">Send application</p>
        <div className="resume-card send-success-card" role="status">
          <p className="resume-card-title"><strong>Application email sent.</strong></p>
          <p className="quiet-note">This application is now marked as SENT. You can track follow-ups from the dashboard later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-section">
      <p className="section-label">Send application</p>

      {!canSend ? (
        <div className="empty-card">
          <h2>Not ready to send yet.</h2>
          <p>{blockReason}</p>
          {!gmailConnected ? (
            <Link className="button secondary" href="/settings">
              Connect Gmail in Settings
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="send-card">
          <p className="quiet-note">
            This action sends the saved draft through your connected Gmail account. Review the subject, body, and
            recipient carefully before continuing.
          </p>
          <label className="send-confirm">
            <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            <span>I have reviewed this email and approve sending it now.</span>
          </label>
          <button className="button send-button" disabled={pending || !confirmed} onClick={handleSend} type="button">
            {pending ? "Sending through Gmail…" : "Send application email"}
          </button>
          {error ? (
            <p className="upload-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

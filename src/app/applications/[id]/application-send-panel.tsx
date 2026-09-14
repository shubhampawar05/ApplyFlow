"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttachmentChip } from "@/components/attachment-chip";
import { Button } from "@/components/button";
import { useToast } from "@/components/toast-provider";
import { mediaUrl } from "@/lib/media/urls";

type DuplicateApplication = {
  id: string;
  status: string;
  updatedAt: string;
  job: {
    company: string | null;
    title: string | null;
    applicationEmail: string | null;
  };
};

export function ApplicationSendPanel({
  applicationId,
  canSend,
  blockReason,
  gmailConnected,
  applicationStatus,
  duplicateApplications,
  resumeFileName,
  resumeId,
}: {
  applicationId: string;
  canSend: boolean;
  blockReason?: string;
  gmailConnected: boolean;
  applicationStatus: string;
  duplicateApplications: DuplicateApplication[];
  resumeFileName?: string | null;
  resumeId?: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(applicationStatus === "SENT");
  const hasDuplicates = duplicateApplications.length > 0;
  const canSubmit = confirmed && (!hasDuplicates || acknowledgedDuplicate);

  async function handleSend() {
    if (!confirmed) {
      setError("Check the confirmation box before sending.");
      return;
    }

    if (hasDuplicates && !acknowledgedDuplicate) {
      setError("Acknowledge the duplicate warning before sending.");
      return;
    }

    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          ...(hasDuplicates ? { acknowledgeDuplicate: true } : {}),
        }),
      });

      const payload = (await response.json()) as {
        error?: { message?: string; details?: { duplicates?: DuplicateApplication[] } };
      };

      if (!response.ok) {
        setError(payload.error?.message ?? "Gmail could not send this email. Your draft is still saved.");
        return;
      }

      setSent(true);
      showToast("Application email sent.");
      router.refresh();
    } catch {
      setError("Gmail could not send this email. Your draft is still saved.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <section className="settings-section" id="section-send">
        <p className="section-label">Send application</p>
        <div className="resume-card send-success-card" role="status">
          <p className="resume-card-title"><strong>Application email sent.</strong></p>
          <p className="quiet-note">This application is now marked as SENT. You can track follow-ups from the dashboard later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-section" id="section-send">
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
          {hasDuplicates ? (
            <div className="duplicate-warning" role="alert">
              <strong>Possible duplicate application</strong>
              <p>This role looks similar to another application you already saved or sent.</p>
              <ul>
                {duplicateApplications.map((duplicate) => (
                  <li key={duplicate.id}>
                    <Link href={`/applications/${duplicate.id}`}>
                      {duplicate.job.title ?? "Untitled role"} at {duplicate.job.company ?? "Unknown company"} ({duplicate.status.replaceAll("_", " ")})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="quiet-note">
            This action sends the saved draft through your connected Gmail account with your resume attached. Review the
            subject, body, and recipient carefully before continuing.
          </p>
          {resumeFileName && resumeId ? (
            <AttachmentChip
              fileName={resumeFileName}
              href={mediaUrl("resume", resumeId)}
              label="Will attach on send"
            />
          ) : null}
          <label className="send-confirm">
            <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            <span>I have reviewed this email and approve sending it now.</span>
          </label>
          {hasDuplicates ? (
            <label className="send-confirm">
              <input
                checked={acknowledgedDuplicate}
                onChange={(event) => setAcknowledgedDuplicate(event.target.checked)}
                type="checkbox"
              />
              <span>I understand this may duplicate a recent application and still want to send.</span>
            </label>
          ) : null}
          <Button className="send-button" disabled={!canSubmit} loading={pending} onClick={handleSend} type="button">
            Send application email
          </Button>
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

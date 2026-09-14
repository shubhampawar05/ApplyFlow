"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AiProcessingBanner } from "@/components/ai-processing-banner";
import { Button } from "@/components/button";
import { ErrorRecoveryHint } from "@/components/error-recovery-hint";
import { useToast } from "@/components/toast-provider";

type EmailDraft = {
  id: string;
  to: string;
  subject: string;
  body: string;
};

export function ApplicationEmailPanel({
  applicationId,
  initialEmail,
  canGenerate,
  blockReason,
}: {
  applicationId: string;
  initialEmail: EmailDraft | null;
  canGenerate: boolean;
  blockReason?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [email, setEmail] = useState<EmailDraft | null>(initialEmail);

  async function handleGenerate() {
    setGenerating(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/generate-email`, { method: "POST" });
      const payload = (await response.json()) as {
        data?: { email?: EmailDraft };
        error?: { message?: string };
      };

      if (!response.ok) {
        setError(payload.error?.message ?? "We could not generate the email draft. Try again.");
        return;
      }

      if (payload.data?.email) {
        setEmail(payload.data.email);
      }

      router.refresh();
    } catch {
      setError("We could not generate the email draft. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setSaving(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: email.subject,
          body: email.body,
        }),
      });

      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setError(payload.error?.message ?? "We could not save your email changes.");
        return;
      }

      showToast("Email draft saved.");
      router.refresh();
    } catch {
      setError("We could not save your email changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="settings-section" id="section-email">
      <p className="section-label">Application email</p>

      {!canGenerate ? (
        <div className="empty-card">
          <h2>Complete the prerequisites first.</h2>
          <p>{blockReason}</p>
          {blockReason?.includes("Settings") ? (
            <Link className="button secondary" href="/settings">
              Go to Settings
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="resume-card">
          <p className="resume-card-title">
            {email ? <strong>Review and edit your email draft.</strong> : <strong>Draft a grounded application email.</strong>}
          </p>
          <p className="quiet-note">
            Claims are grounded in your resume profile. Nothing is sent until you explicitly approve sending later.
          </p>
          {generating ? <AiProcessingBanner message="Drafting a grounded application email…" /> : null}
          <Button loading={generating} onClick={handleGenerate} type="button" variant="secondary">
            {email ? "Regenerate email draft" : "Generate email draft"}
          </Button>
          {error && !email ? (
            <>
              <p className="upload-error" role="alert">
                {error}
              </p>
              <ErrorRecoveryHint href="#section-job-review" linkLabel="Review job details">
                Confirm the application email is valid, then try generating again.
              </ErrorRecoveryHint>
            </>
          ) : null}
        </div>
      )}

      {email ? (
        <form className="profile-review" onSubmit={handleSave}>
          <label>
            To
            <input readOnly value={email.to} />
          </label>
          <label>
            Subject
            <input
              value={email.subject}
              onChange={(event) => setEmail({ ...email, subject: event.target.value })}
            />
          </label>
          <label>
            Body
            <textarea
              rows={12}
              value={email.body}
              onChange={(event) => setEmail({ ...email, body: event.target.value })}
            />
          </label>
          {error ? (
            <>
              <p className="upload-error" role="alert">
                {error}
              </p>
              <ErrorRecoveryHint href="#section-job-review" linkLabel="Review job details">
                Confirm the application email is valid, then try generating again.
              </ErrorRecoveryHint>
            </>
          ) : null}
          <Button loading={saving} type="submit">
            Save email draft
          </Button>
        </form>
      ) : canGenerate ? (
        <div className="empty-card">
          <h2>Generate a personalized application email.</h2>
          <p>
            ApplyFlow drafts a concise email using your resume facts and the reviewed job details. You can edit every
            line before sending.
          </p>
        </div>
      ) : null}
    </section>
  );
}

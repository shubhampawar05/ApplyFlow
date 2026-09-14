"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState<EmailDraft | null>(initialEmail);

  async function handleGenerate() {
    setGenerating(true);
    setError(undefined);
    setSaved(false);

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
    setSaved(false);

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

      setSaved(true);
      router.refresh();
    } catch {
      setError("We could not save your email changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="settings-section">
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
          <button className="button secondary" disabled={generating} onClick={handleGenerate} type="button">
            {generating ? "Generating email…" : email ? "Regenerate email draft" : "Generate email draft"}
          </button>
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
            <p className="upload-error" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="quiet-note" role="status">
              Email draft saved.
            </p>
          ) : null}
          <button className="button" disabled={saving} type="submit">
            {saving ? "Saving…" : "Save email draft"}
          </button>
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

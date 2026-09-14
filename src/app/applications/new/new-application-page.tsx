"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useId, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";

const maxFileSize = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function NewApplicationPage({ userLabel }: { userLabel: string }) {
  const inputId = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      setFileName(undefined);
      setError("Choose a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > maxFileSize) {
      setFileName(undefined);
      setError("This image is larger than 10 MB. Please choose a smaller file.");
      return;
    }
    setError(undefined);
    setFileName(file.name);
  }

  async function handleContinue() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a job screenshot to upload.");
      return;
    }

    setPending(true);
    setError(undefined);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/jobs/screenshot", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        data?: { application?: { id: string } };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data?.application?.id) {
        setError(payload.error?.message ?? "We could not save this screenshot. Please try again.");
        return;
      }

      router.push(`/applications/${payload.data.application.id}`);
    } catch {
      setError("We could not save this screenshot. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell activePath="/applications/new" userLabel={userLabel}>
      <header>
        <p className="eyebrow">New application</p>
        <h1>Bring in the job posting.</h1>
        <p className="lede">
          A clear screenshot is enough to begin. You’ll review every extracted detail before we prepare an email.
        </p>
      </header>
      <div className="progress" aria-label="Application progress">
        <div className="progress-step">
          <span className="step-number">01 — NOW</span>
          <strong>Add screenshot</strong>
          <span>Upload the job posting you found.</span>
        </div>
        <div className="progress-step">
          <span className="step-number">02</span>
          <strong>Review details</strong>
          <span>Check the extracted role and contact.</span>
        </div>
        <div className="progress-step">
          <span className="step-number">03</span>
          <strong>Prepare email</strong>
          <span>Refine a grounded application draft.</span>
        </div>
      </div>
      <section className="upload-card" aria-labelledby="upload-heading">
        <label className="dropzone" htmlFor={inputId}>
          <div>
            <div className="upload-symbol" aria-hidden="true">↑</div>
            <h2 id="upload-heading">Drop a screenshot here</h2>
            <p>or choose an image from your device</p>
            <p className="file-types">PNG, JPG, or WEBP · up to 10 MB</p>
          </div>
          <input
            ref={inputRef}
            className="file-input"
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
        </label>
        {error && (
          <p className="upload-error" role="alert">
            {error}
          </p>
        )}
        {fileName && (
          <div className="upload-ready" role="status">
            <span>Ready to review: {fileName}</span>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setFileName(undefined);
                setError(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove
            </button>
          </div>
        )}
      </section>
      <div className="upload-actions">
        <Link className="button secondary" href="/dashboard">
          Cancel
        </Link>
        <button
          className="button"
          type="button"
          disabled={!fileName || pending}
          aria-disabled={!fileName || pending}
          onClick={handleContinue}
        >
          {pending ? "Saving screenshot…" : "Continue to review"}
        </button>
      </div>
      <p className="quiet-note">
        Uploads remain private. In the next step, you’ll be able to correct anything the system reads from the image.
      </p>
    </AppShell>
  );
}

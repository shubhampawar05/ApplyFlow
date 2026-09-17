"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";

const maxFileSize = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function NewApplicationPage({ userLabel }: { userLabel: string }) {
  const inputId = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelection() {
    setFileName(undefined);
    setError(undefined);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(undefined);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      clearSelection();
      setError("Choose a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > maxFileSize) {
      clearSelection();
      setError("This image is larger than 10 MB. Please choose a smaller file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError(undefined);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
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
      <FlowStepper
        activeStepId="screenshot"
        steps={[
          {
            id: "screenshot",
            label: "Add screenshot",
            description: "Upload the job posting you found.",
            status: "current",
          },
          {
            id: "review",
            label: "Review details",
            description: "Check the extracted role and contact.",
            status: "upcoming",
          },
          {
            id: "email",
            label: "Prepare email",
            description: "Refine a grounded application draft.",
            status: "upcoming",
          },
        ]}
      />
      <section className="upload-card" aria-labelledby="upload-heading">
        <label className={`dropzone ${previewUrl ? "has-preview" : ""}`} htmlFor={inputId}>
          {previewUrl ? (
            <div className="upload-preview">
              <img alt={`Selected screenshot preview: ${fileName ?? "job posting"}`} src={previewUrl} />
            </div>
          ) : (
            <div>
              <div className="upload-symbol" aria-hidden="true">↑</div>
              <h2 id="upload-heading">Drop a screenshot here</h2>
              <p>or choose an image from your device</p>
              <p className="file-types">PNG, JPG, or WEBP · up to 10 MB</p>
            </div>
          )}
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
            <button className="button secondary" onClick={clearSelection} type="button">
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

"use client";

import { ChangeEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";

const maxFileSize = 10 * 1024 * 1024;
const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function ResumeUploadForm() {
  const inputId = useId();
  const router = useRouter();
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.has(file.type)) {
      setFileName(undefined);
      setError("Choose a PDF or DOCX resume.");
      return;
    }

    if (file.size > maxFileSize) {
      setFileName(undefined);
      setError("This resume is larger than 10 MB. Please choose a smaller file.");
      return;
    }

    setError(undefined);
    setFileName(file.name);
  }

  async function handleUpload() {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a resume file to upload.");
      return;
    }

    setPending(true);
    setError(undefined);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        data?: unknown;
        error?: { message?: string };
      };

      if (!response.ok) {
        setError(payload.error?.message ?? "We could not upload your resume. Please try again.");
        return;
      }

      setFileName(undefined);
      if (input) input.value = "";
      router.refresh();
    } catch {
      setError("We could not upload your resume. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="upload-card" aria-labelledby="resume-upload-heading">
      <label className="dropzone" htmlFor={inputId}>
        <div>
          <div className="upload-symbol" aria-hidden="true">↑</div>
          <h2 id="resume-upload-heading">Upload your resume</h2>
          <p>PDF or DOCX · up to 10 MB · stored privately</p>
        </div>
        <input
          className="file-input"
          id={inputId}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
          <span>Ready to upload: {fileName}</span>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setFileName(undefined);
              setError(undefined);
              const input = document.getElementById(inputId) as HTMLInputElement | null;
              if (input) input.value = "";
            }}
          >
            Remove
          </button>
        </div>
      )}
      <div className="upload-actions">
        <button className="button" disabled={!fileName || pending} onClick={handleUpload} type="button">
          {pending ? "Uploading…" : "Save resume"}
        </button>
      </div>
    </section>
  );
}

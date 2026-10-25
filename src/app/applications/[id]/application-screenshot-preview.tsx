"use client";

// Purpose: screenshot thumbnail that opens a full-size view of the job screenshot.
// Constraints: loads only through the owner-scoped media route; native dialog handles Escape and focus.
import { useRef } from "react";
import { mediaUrl } from "@/lib/media/urls";

export function ApplicationScreenshotPreview({
  jobId,
  fileName,
  showHint = true,
}: {
  jobId: string;
  fileName: string;
  showHint?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const src = mediaUrl("job-screenshot", jobId);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <div className="media-preview">
      <button
        aria-label={`Open full-size screenshot: ${fileName}`}
        className="media-preview-thumb"
        onClick={() => dialogRef.current?.showModal()}
        ref={thumbRef}
        type="button"
      >
        <img alt={`Job screenshot: ${fileName}`} src={src} />
      </button>
      {showHint ? <p className="quiet-note">Select the preview to see the full screenshot.</p> : null}

      <dialog
        aria-label="Full-size job screenshot"
        className="media-lightbox"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onClose={() => thumbRef.current?.focus()}
        ref={dialogRef}
      >
        <button className="media-lightbox-close" onClick={close} type="button">
          Close
        </button>
        <img alt={fileName} className="media-lightbox-image" loading="lazy" src={src} />
      </dialog>
    </div>
  );
}

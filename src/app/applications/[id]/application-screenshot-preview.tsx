"use client";

import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/media/urls";

export function ApplicationScreenshotPreview({
  jobId,
  fileName,
}: {
  jobId: string;
  fileName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const src = mediaUrl("job-screenshot", jobId);

  useEffect(() => {
    if (!expanded) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  return (
    <div className="media-preview">
      <button
        aria-label={`Expand screenshot preview for ${fileName}`}
        className="media-preview-thumb"
        onClick={() => setExpanded(true)}
        type="button"
      >
        <img alt={`Job screenshot: ${fileName}`} src={src} />
      </button>
      <p className="quiet-note">Click the preview to expand the full screenshot.</p>

      {expanded ? (
        <div
          aria-label="Expanded screenshot preview"
          className="media-lightbox"
          onClick={() => setExpanded(false)}
          role="dialog"
        >
          <button
            aria-label="Close screenshot preview"
            className="media-lightbox-close"
            onClick={() => setExpanded(false)}
            type="button"
          >
            Close
          </button>
          <img alt={fileName} className="media-lightbox-image" onClick={(event) => event.stopPropagation()} src={src} />
        </div>
      ) : null}
    </div>
  );
}

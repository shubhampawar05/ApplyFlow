// Purpose: visible AI-in-progress status with elapsed time for long-running operations.
// Constraints: presentational only; parent controls when it is shown.
"use client";

import { useEffect, useState } from "react";
import { Spinner } from "./spinner";

export function AiProcessingBanner({ message }: { message: string }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div aria-live="polite" className="ai-processing-banner" role="status">
      <Spinner label="Processing" />
      <div className="ai-processing-copy">
        <strong>{message}</strong>
        <span className="ai-processing-elapsed">
          {elapsedSeconds === 0 ? "Just started…" : `Working… ${elapsedSeconds}s`}
        </span>
      </div>
    </div>
  );
}

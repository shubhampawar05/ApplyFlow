"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type GmailStatus = {
  connected: boolean;
  accountEmail?: string | null;
};

export function GmailConnectPanel({ initialStatus }: { initialStatus: GmailStatus }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(initialStatus);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      setNotice("Gmail connected successfully.");
    } else if (gmailParam === "denied") {
      setNotice("Gmail connection was cancelled.");
    } else if (gmailParam === "error") {
      setNotice("Gmail connection failed. Try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function refreshStatus() {
      try {
        const response = await fetch("/api/integrations/gmail/status");
        const payload = (await response.json()) as { data?: GmailStatus };
        if (!cancelled && payload.data) {
          setStatus(payload.data);
        }
      } catch {
        // Keep server-rendered status when refresh fails.
      }
    }

    if (searchParams.get("gmail") === "connected") {
      void refreshStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <section className="settings-section">
      <p className="section-label">Gmail</p>
      <div className="resume-card">
        <p className="resume-card-title">
          {status.connected ? (
            <>
              Connected as <strong>{status.accountEmail ?? "Gmail account"}</strong>
            </>
          ) : (
            <strong>Connect Gmail to send approved application emails.</strong>
          )}
        </p>
        <p className="quiet-note">
          ApplyFlow only requests permission to send email. Nothing is sent without your explicit approval on each
          application.
        </p>
        <a className="button secondary" href="/api/integrations/gmail/connect?returnTo=/settings">
          {status.connected ? "Reconnect Gmail" : "Connect Gmail"}
        </a>
        {notice ? <p className="quiet-note" role="status">{notice}</p> : null}
      </div>
    </section>
  );
}

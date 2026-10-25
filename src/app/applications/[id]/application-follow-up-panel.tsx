"use client";

// Purpose: show and manage the follow-up reminder on a sent application.
// Constraints: reminders only (never drafts or sends email); calls the owner-scoped follow-up endpoint.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { useToast } from "@/components/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";

type FollowUpAction =
  | { action: "reschedule"; followUpAt: string }
  | { action: "complete" }
  | { action: "clear" };

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

const followUpDateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function ApplicationFollowUpPanel({
  applicationId,
  followUpAt,
  followUpCompletedAt,
  active,
}: {
  applicationId: string;
  followUpAt: string | null;
  followUpCompletedAt: string | null;
  active: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const currentDate = followUpAt ? new Date(followUpAt) : null;
  const [date, setDate] = useState(toDateInputValue(currentDate));
  const [pending, setPending] = useState<FollowUpAction["action"] | null>(null);
  const [error, setError] = useState<string>();

  async function update(body: FollowUpAction, successMessage: string) {
    setPending(body.action);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/follow-up`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        setError(getApiErrorMessage(payload, "We could not update the follow-up. Try again."));
        return;
      }

      showToast(successMessage);
      router.refresh();
    } catch {
      setError("We could not update the follow-up. Try again.");
    } finally {
      setPending(null);
    }
  }

  let summary = "No follow-up scheduled.";
  if (followUpCompletedAt) {
    summary = "Follow-up done.";
  } else if (currentDate) {
    summary = `Follow up on ${followUpDateFormatter.format(currentDate)}.`;
  }

  return (
    <section aria-labelledby="follow-up-heading" className="settings-section follow-up-panel">
      <p className="section-label" id="follow-up-heading">
        Follow-up reminder
      </p>
      <p className="follow-up-summary">{summary}</p>
      {!active ? (
        <p className="quiet-note">This application has an outcome, so it no longer shows as due.</p>
      ) : null}
      <form
        className="follow-up-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!date) {
            setError("Choose a date first.");
            return;
          }
          void update({ action: "reschedule", followUpAt: date }, "Follow-up date saved");
        }}
      >
        <label>
          <span>Follow-up date</span>
          <input min={todayInputValue()} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
        </label>
        <div className="follow-up-actions">
          <Button disabled={pending !== null} loading={pending === "reschedule"} type="submit" variant="secondary">
            Save date
          </Button>
          {currentDate && !followUpCompletedAt ? (
            <Button
              disabled={pending !== null}
              loading={pending === "complete"}
              onClick={() => update({ action: "complete" }, "Follow-up marked done")}
              type="button"
            >
              Mark done
            </Button>
          ) : null}
          {currentDate || followUpCompletedAt ? (
            <Button
              className="button-quiet"
              disabled={pending !== null}
              loading={pending === "clear"}
              onClick={() => update({ action: "clear" }, "Follow-up cleared")}
              type="button"
              variant="secondary"
            >
              Clear
            </Button>
          ) : null}
        </div>
      </form>
      {error ? (
        <p className="upload-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

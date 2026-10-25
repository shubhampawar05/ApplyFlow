// Purpose: job context (screenshot and key facts) shown beside every step of the application page.
// Constraints: presentational server component; screenshot only via owner-scoped media route; unknown facts shown as "Not found".
import { MatchScoreBadge } from "@/components/match-score-badge";
import { ApplicationScreenshotPreview } from "./application-screenshot-preview";

export type ApplicationContextFacts = {
  jobId: string;
  screenshotFileName: string | null;
  company: string | null;
  title: string | null;
  recipient: string | null;
  matchScore: number | null;
  status: string;
  followUpAt: Date | null;
  followUpCompletedAt: Date | null;
};

// Follow-up dates are stored as midnight UTC of the chosen calendar date.
const followUpDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="context-fact">
      <dt>{label}</dt>
      <dd className={value ? undefined : "context-fact-missing"}>{value ?? "Not found"}</dd>
    </div>
  );
}

function followUpLabel(facts: ApplicationContextFacts) {
  if (facts.followUpCompletedAt) return "Done";
  if (!facts.followUpAt) return null;
  return followUpDateFormatter.format(facts.followUpAt);
}

function ContextFacts({ facts }: { facts: ApplicationContextFacts }) {
  const isSent = facts.followUpAt !== null || facts.followUpCompletedAt !== null;

  return (
    <dl className="context-facts">
      <Fact label="Company" value={facts.company} />
      <Fact label="Role" value={facts.title} />
      <Fact label="Send to" value={facts.recipient} />
      <div className="context-fact">
        <dt>Match</dt>
        <dd>
          {facts.matchScore !== null ? (
            <MatchScoreBadge score={facts.matchScore} />
          ) : (
            <span className="context-fact-missing">Not run yet</span>
          )}
        </dd>
      </div>
      <Fact label="Status" value={facts.status.replaceAll("_", " ")} />
      {isSent ? <Fact label="Follow up" value={followUpLabel(facts)} /> : null}
    </dl>
  );
}

export function ApplicationContextRail({ facts }: { facts: ApplicationContextFacts }) {
  const screenshot = facts.screenshotFileName ? (
    <ApplicationScreenshotPreview fileName={facts.screenshotFileName} jobId={facts.jobId} showHint={false} />
  ) : null;

  return (
    <>
      <aside aria-label="Job summary" className="context-rail">
        {screenshot}
        <ContextFacts facts={facts} />
      </aside>
      <details className="context-summary">
        <summary>
          <span>Job summary</span>
          <span className="context-summary-hint">{facts.company ?? facts.title ?? "Details"}</span>
        </summary>
        <div className="context-summary-body">
          {screenshot}
          <ContextFacts facts={facts} />
        </div>
      </details>
    </>
  );
}

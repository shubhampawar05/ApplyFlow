// Purpose: dashboard list of the user's applications, with first-run and no-match empty states.
// Constraints: presentational only; data is already user-scoped and filtered on the server.
import Link from "next/link";
import { MatchScoreBadge } from "@/components/match-score-badge";
import { isFollowUpDue } from "@/features/applications/application-follow-up.service";
import { isSendOutcomeUnknown } from "@/features/applications/application-send-state";
import { mediaUrl } from "@/lib/media/urls";

type ApplicationListItem = {
  id: string;
  status: string;
  matchScore: number | null;
  sendOutcomeUnknown: boolean;
  sendStartedAt: Date | null;
  followUpAt: Date | null;
  followUpCompletedAt: Date | null;
  updatedAt: Date;
  job: {
    id: string;
    company: string | null;
    title: string | null;
    applicationEmail: string | null;
    screenshotStorageKey: string | null;
  };
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusClass(status: string) {
  if (status === "SENT" || status === "OFFER") return "status-badge positive";
  if (status === "REJECTED" || status === "CLOSED") return "status-badge muted";
  if (status === "READY") return "status-badge ready";
  return "status-badge";
}

function fallbackLabel(job: ApplicationListItem["job"]) {
  const source = job.company ?? job.title ?? "Application";
  return source.slice(0, 2).toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
// Follow-up dates are stored as midnight UTC of the chosen calendar date.
const followUpDateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

export function ApplicationList({
  applications,
  filtered,
  clearHref,
  now,
}: {
  applications: ApplicationListItem[];
  filtered: boolean;
  clearHref: string;
  now: Date;
}) {
  if (applications.length === 0 && filtered) {
    return (
      <div className="empty-card dashboard-no-match" role="status">
        <h2>No matching applications.</h2>
        <p>Nothing matches this search or filter. Try a different company or title, or clear the filters.</p>
        <Link className="button secondary" href={clearHref}>
          Clear search and filters
        </Link>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="empty-card dashboard-empty-card">
        <div className="empty-icon" aria-hidden="true">⌁</div>
        <h2>Your application list is ready when you are.</h2>
        <p>
          Your first job screenshot becomes a draft you can check, refine, and choose to send. Nothing leaves
          ApplyFlow without your explicit approval.
        </p>
        <ol className="dashboard-empty-steps">
          <li>Upload a job screenshot</li>
          <li>Review extracted details and match your resume</li>
          <li>Draft, edit, and approve the email before sending</li>
        </ol>
        <Link className="button" href="/applications/new">Add your first screenshot</Link>
      </div>
    );
  }

  return (
    <div className="application-list">
      {applications.map((application) => {
        const hasScreenshot = Boolean(application.job.screenshotStorageKey);
        const sendUnknown = isSendOutcomeUnknown(application, now);
        const followUpDue = isFollowUpDue(application, now);

        return (
          <Link className="application-card" href={`/applications/${application.id}`} key={application.id}>
            <div className="application-card-main">
              {hasScreenshot ? (
                <img
                  alt=""
                  className="application-card-thumb"
                  loading="lazy"
                  src={mediaUrl("job-screenshot", application.job.id)}
                />
              ) : (
                <div aria-hidden="true" className="application-card-thumb application-card-thumb-fallback">
                  {fallbackLabel(application.job)}
                </div>
              )}

              <div className="application-card-body">
                <div className="application-card-head">
                  <div>
                    <h2>{application.job.title ?? "Untitled role"}</h2>
                    <p>{application.job.company ?? "Company pending review"}</p>
                  </div>
                  <div className="application-card-badges">
                    {sendUnknown ? <span className="status-badge attention">Check send</span> : null}
                    {followUpDue ? <span className="status-badge attention">Follow-up due</span> : null}
                    {application.matchScore !== null ? <MatchScoreBadge score={application.matchScore} /> : null}
                    <span className={statusClass(application.status)}>{formatStatus(application.status)}</span>
                  </div>
                </div>
                <div className="application-card-meta">
                  <span>Updated {dateFormatter.format(application.updatedAt)}</span>
                  {application.followUpAt && !application.followUpCompletedAt && !followUpDue ? (
                    <span>Follow up {followUpDateFormatter.format(application.followUpAt)}</span>
                  ) : null}
                  {application.job.applicationEmail ? <span>{application.job.applicationEmail}</span> : null}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

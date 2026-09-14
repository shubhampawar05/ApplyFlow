import Link from "next/link";
import { MatchScoreBadge } from "@/components/match-score-badge";
import { mediaUrl } from "@/lib/media/urls";

type ApplicationListItem = {
  id: string;
  status: string;
  matchScore: number | null;
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

export function ApplicationList({ applications }: { applications: ApplicationListItem[] }) {
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
                    {application.matchScore !== null ? <MatchScoreBadge score={application.matchScore} /> : null}
                    <span className={statusClass(application.status)}>{formatStatus(application.status)}</span>
                  </div>
                </div>
                <div className="application-card-meta">
                  <span>Updated {application.updatedAt.toLocaleString()}</span>
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

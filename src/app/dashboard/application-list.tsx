import Link from "next/link";

type ApplicationListItem = {
  id: string;
  status: string;
  matchScore: number | null;
  updatedAt: Date;
  job: {
    company: string | null;
    title: string | null;
    applicationEmail: string | null;
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

export function ApplicationList({ applications }: { applications: ApplicationListItem[] }) {
  if (applications.length === 0) {
    return (
      <div className="empty-card">
        <div className="empty-icon" aria-hidden="true">⌁</div>
        <h2>Your application list is ready when you are.</h2>
        <p>
          Your first job screenshot becomes a draft you can check, refine, and choose to send. Nothing leaves
          ApplyFlow without your explicit approval.
        </p>
        <Link className="button" href="/applications/new">Add your first screenshot</Link>
      </div>
    );
  }

  return (
    <div className="application-list">
      {applications.map((application) => (
        <Link className="application-card" href={`/applications/${application.id}`} key={application.id}>
          <div className="application-card-head">
            <div>
              <h2>{application.job.title ?? "Untitled role"}</h2>
              <p>{application.job.company ?? "Company pending review"}</p>
            </div>
            <span className={statusClass(application.status)}>{formatStatus(application.status)}</span>
          </div>
          <div className="application-card-meta">
            <span>Updated {application.updatedAt.toLocaleString()}</span>
            {application.matchScore !== null ? <span>Match {application.matchScore}/100</span> : null}
            {application.job.applicationEmail ? <span>{application.job.applicationEmail}</span> : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

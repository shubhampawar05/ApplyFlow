import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { getApplicationForUser } from "@/features/applications/application.repository";

function screenshotLabel(storageKey: string | null | undefined) {
  if (!storageKey) return "Screenshot";
  const parts = storageKey.split("/");
  return parts[parts.length - 1] || "Screenshot";
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const application = await getApplicationForUser(user.id, id);

  if (!application) {
    notFound();
  }

  const job = application.job;

  return (
    <AppShell activePath="" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Application</p>
      <h1>{job.title ?? "Job details pending extraction"}</h1>
      <p className="lede">
        Status: <strong>{application.status}</strong>. Your screenshot is saved privately. AI extraction and editable job
        review come in the next milestone.
      </p>

      <section className="settings-section">
        <p className="section-label">Screenshot intake</p>
        <div className="resume-card" role="status">
          <p className="resume-card-title">
            Saved screenshot: <strong>{screenshotLabel(job.screenshotStorageKey)}</strong>
          </p>
          <p className="quiet-note">Uploaded {application.createdAt.toLocaleString()}</p>
        </div>
      </section>

      <section className="settings-section">
        <p className="section-label">Job fields</p>
        <div className="empty-card">
          <h2>Extraction has not run yet.</h2>
          <p>
            Company, title, location, and application contact will appear here after vision-based extraction. Missing
            fields will stay empty instead of being invented.
          </p>
          <dl className="job-field-list">
            <div><dt>Company</dt><dd>{job.company ?? "—"}</dd></div>
            <div><dt>Title</dt><dd>{job.title ?? "—"}</dd></div>
            <div><dt>Location</dt><dd>{job.location ?? "—"}</dd></div>
            <div><dt>Application email</dt><dd>{job.applicationEmail ?? "—"}</dd></div>
          </dl>
        </div>
      </section>
    </AppShell>
  );
}

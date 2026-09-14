import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { getApplicationForUser } from "@/features/applications/application.repository";
import { JobExtractButton } from "./job-extract-button";
import { JobReviewForm } from "./job-review-form";

function screenshotLabel(storageKey: string | null | undefined) {
  if (!storageKey) return "Screenshot";
  const parts = storageKey.split("/");
  return parts[parts.length - 1] || "Screenshot";
}

function hasExtractedFields(job: {
  company: string | null;
  title: string | null;
  applicationEmail: string | null;
}) {
  return Boolean(job.company || job.title || job.applicationEmail);
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const application = await getApplicationForUser(user.id, id);

  if (!application) {
    notFound();
  }

  const job = application.job;
  const extracted = hasExtractedFields(job);

  return (
    <AppShell activePath="" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Application</p>
      <h1>{job.title ?? "Review the job posting"}</h1>
      <p className="lede">
        Status: <strong>{application.status}</strong>. Extract details from your screenshot, then review and correct
        anything before the next application steps.
      </p>

      <section className="settings-section">
        <p className="section-label">Screenshot intake</p>
        <div className="resume-card" role="status">
          <p className="resume-card-title">
            Saved screenshot: <strong>{screenshotLabel(job.screenshotStorageKey)}</strong>
          </p>
          <p className="quiet-note">Uploaded {application.createdAt.toLocaleString()}</p>
          <JobExtractButton hasExtractedFields={extracted} jobId={job.id} />
        </div>
      </section>

      <section className="settings-section">
        {extracted ? (
          <JobReviewForm
            jobId={job.id}
            initialJob={{
              company: job.company,
              title: job.title,
              location: job.location,
              employmentType: job.employmentType,
              experience: job.experience,
              applicationEmail: job.applicationEmail,
              applicationUrl: job.applicationUrl,
              salary: job.salary,
              source: job.source,
              skills: job.skills,
              description: job.description,
            }}
          />
        ) : (
          <div className="empty-card">
            <h2>Extract job details to begin review.</h2>
            <p>
              Company, title, location, skills, and application contact will appear here after vision-based extraction.
              Missing fields stay empty instead of being invented.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { findLikelyDuplicateApplicationsForUser } from "@/features/applications/application-duplicate.service";
import { parseStoredMatchDetails } from "@/features/applications/application-match.service";
import { getApplicationDetailForUser } from "@/features/applications/application.repository";
import { getDefaultResumeWithProfile } from "@/features/resume/resume.repository";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { getGmailConnectionStatus } from "@/features/integrations/gmail/gmail.service";
import { ApplicationEmailPanel } from "./application-email-panel";
import { ApplicationMatchPanel } from "./application-match-panel";
import { ApplicationSendPanel } from "./application-send-panel";
import { ApplicationStatusPanel } from "./application-status-panel";
import { ApplicationTimeline } from "./application-timeline";
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

function isValidEmail(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const application = await getApplicationDetailForUser(user.id, id);

  if (!application) {
    notFound();
  }

  const job = application.job;
  const extracted = hasExtractedFields(job);
  const defaultResume = application.resume ?? (await getDefaultResumeWithProfile(user.id));
  const hasResumeProfile = Boolean(defaultResume?.profile);
  const jobReadyForMatch = Boolean(
    (job.company || job.title) && (job.skills.length > 0 || job.description),
  );
  const hasRecipientEmail = isValidEmail(job.applicationEmail);
  const latestMatchEvent = application.events.find((event) => event.type === "MATCH_COMPLETED");
  const initialMatch = parseStoredMatchDetails(latestMatchEvent?.metadata);
  const selectedEmail = application.emails.find((email) => email.isSelected) ?? application.emails[0] ?? null;
  const gmailStatus = await getGmailConnectionStatus(user.id);
  const duplicateApplications = await findLikelyDuplicateApplicationsForUser(user.id, application.id);

  let matchBlockReason = "Extract and review the job details before running a match.";
  if (extracted && !hasResumeProfile) {
    matchBlockReason = "Upload and parse your resume in Settings before running a match.";
  } else if (extracted && hasResumeProfile && !jobReadyForMatch) {
    matchBlockReason = "Add a job title or company plus skills or a description before running a match.";
  }

  let emailBlockReason = "Extract and review the job details before generating an email.";
  if (extracted && !hasResumeProfile) {
    emailBlockReason = "Upload and parse your resume in Settings before generating an email.";
  } else if (extracted && hasResumeProfile && !hasRecipientEmail) {
    emailBlockReason = "Add a valid application email on the job review form before generating a draft.";
  }

  let sendBlockReason = "Generate and save an email draft before sending.";
  if (extracted && selectedEmail && application.status !== "READY" && application.status !== "SENT") {
    sendBlockReason = "Save your email draft to mark the application READY before sending.";
  } else if (extracted && selectedEmail && !gmailStatus.connected) {
    sendBlockReason = "Connect Gmail in Settings before sending this application.";
  } else if (extracted && selectedEmail && !application.resumeId) {
    sendBlockReason = "This application needs a selected resume before sending.";
  }

  return (
    <AppShell activePath="" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Application</p>
      <h1>{job.title ?? "Review the job posting"}</h1>
      <p className="lede">
        Status: <strong>{application.status}</strong>. Extract details from your screenshot, review the job, compare
        your resume, then draft and edit the application email.
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
        <p className="section-label">Job review</p>
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

      {extracted ? (
        <ApplicationMatchPanel
          applicationId={application.id}
          blockReason={matchBlockReason}
          canMatch={jobReadyForMatch && hasResumeProfile}
          initialMatch={initialMatch}
        />
      ) : null}

      {extracted ? (
        <ApplicationEmailPanel
          applicationId={application.id}
          blockReason={emailBlockReason}
          canGenerate={hasResumeProfile && hasRecipientEmail}
          initialEmail={
            selectedEmail
              ? {
                  id: selectedEmail.id,
                  to: selectedEmail.to,
                  subject: selectedEmail.subject,
                  body: selectedEmail.body,
                }
              : null
          }
        />
      ) : null}

      {extracted && selectedEmail ? (
        <ApplicationSendPanel
          applicationId={application.id}
          applicationStatus={application.status}
          blockReason={sendBlockReason}
          canSend={
            gmailStatus.connected &&
            Boolean(application.resumeId) &&
            application.status === "READY"
          }
          duplicateApplications={duplicateApplications.map((duplicate) => ({
            ...duplicate,
            updatedAt: duplicate.updatedAt.toISOString(),
          }))}
          gmailConnected={gmailStatus.connected}
        />
      ) : null}

      <ApplicationStatusPanel applicationId={application.id} currentStatus={application.status} />
      <ApplicationTimeline events={application.events} />
    </AppShell>
  );
}

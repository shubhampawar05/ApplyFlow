// Purpose: application detail page: step-by-step flow with job context rail, send, and tracking.
// Constraints: server component; owner-scoped data only; sending requires explicit confirmation in the send panel.
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  findLikelyDuplicateApplicationsForUser,
  shouldBlockApplicationForDuplicates,
} from "@/features/applications/application-duplicate.service";
import {
  getApplicationFlowState,
  isJobReviewStepComplete,
  isMatchStepComplete,
} from "@/features/applications/application-flow-state";
import { parseStoredMatchDetails } from "@/features/applications/application-match.service";
import { getApplicationDetailForUser } from "@/features/applications/application.repository";
import { followUpActiveStatuses, isSentOrLater } from "@/features/applications/application.schemas";
import { isSendOutcomeUnknown } from "@/features/applications/application-send-state";
import { getDefaultResumeWithProfile } from "@/features/resume/resume.repository";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { getGmailConnectionStatus } from "@/features/integrations/gmail/gmail.service";
import { ApplicationContextRail } from "./application-context-rail";
import { ApplicationDuplicateBlock } from "./application-duplicate-block";
import { ApplicationEmailPanel } from "./application-email-panel";
import { ApplicationFlowShell } from "./application-flow-shell";
import { ApplicationFollowUpPanel } from "./application-follow-up-panel";
import { ApplicationMatchPanel } from "./application-match-panel";
import { ApplicationSendOutcomeBanner } from "./application-send-outcome-banner";
import { ApplicationSendPanel } from "./application-send-panel";
import { ApplicationStatusPanel } from "./application-status-panel";
import { ApplicationTimeline } from "./application-timeline";
import { ApplicationScreenshotPreview } from "./application-screenshot-preview";
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
  const matchStepComplete = isMatchStepComplete(application.events);
  const selectedEmail = application.emails.find((email) => email.isSelected) ?? application.emails[0] ?? null;
  const jobReviewComplete = isJobReviewStepComplete({
    events: application.events,
    hasEmailDraft: Boolean(selectedEmail),
    status: application.status,
  });
  const gmailStatus = await getGmailConnectionStatus(user.id);
  const duplicateApplications = await findLikelyDuplicateApplicationsForUser(user.id, application.id);
  const isBlockedByDuplicate = shouldBlockApplicationForDuplicates({
    status: application.status,
    job,
    duplicates: duplicateApplications,
  });
  const duplicateSummaries = duplicateApplications.map((duplicate) => ({
    ...duplicate,
    updatedAt: duplicate.updatedAt.toISOString(),
  }));
  const flow = getApplicationFlowState({
    hasScreenshot: Boolean(job.screenshotStorageKey),
    extracted,
    jobReviewComplete,
    hasMatch: matchStepComplete,
    hasEmailDraft: Boolean(selectedEmail),
    status: application.status,
    blockedByDuplicate: isBlockedByDuplicate,
  });

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
  if (extracted && selectedEmail && application.status !== "READY" && !isSentOrLater(application.status)) {
    sendBlockReason = "Save your email draft to mark the application READY before sending.";
  } else if (extracted && selectedEmail && !gmailStatus.connected) {
    sendBlockReason = "Connect Gmail in Settings before sending this application.";
  } else if (extracted && selectedEmail && !application.resumeId) {
    sendBlockReason = "This application needs a selected resume before sending.";
  }

  const jobReviewFields = {
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
  };

  const screenshotPanel = (
    <section className="flow-section" id="section-screenshot">
      <p className="section-label">Screenshot intake</p>
      <div className="resume-card" role="status">
        <p className="resume-card-title">
          Saved screenshot: <strong>{screenshotLabel(job.screenshotStorageKey)}</strong>
        </p>
        <p className="quiet-note">Uploaded {application.createdAt.toLocaleString()}</p>
        {job.screenshotStorageKey ? (
          <ApplicationScreenshotPreview
            fileName={screenshotLabel(job.screenshotStorageKey)}
            jobId={job.id}
          />
        ) : null}
        <JobExtractButton hasExtractedFields={extracted} jobId={job.id} />
      </div>
    </section>
  );

  const extractReviewPanel = (
    <section className="flow-section" id="section-job-review">
      {isBlockedByDuplicate ? <ApplicationDuplicateBlock duplicates={duplicateSummaries} /> : null}
      {!extracted ? (
        <div className="empty-card">
          <h2>Extract job details to begin review.</h2>
          <p>
            Extraction does not run automatically. Click the button below to read your screenshot with AI, then review
            and correct anything it finds. Missing fields stay empty instead of being invented.
          </p>
          <JobExtractButton hasExtractedFields={extracted} jobId={job.id} />
        </div>
      ) : (
        <>
          <div className="resume-card">
            <p className="resume-card-title">
              <strong>Review what we extracted.</strong>
            </p>
            <p className="quiet-note">
              Check every field below against your screenshot, fix anything that looks wrong, then save to continue to
              match analysis.
            </p>
            <JobExtractButton hasExtractedFields={extracted} jobId={job.id} />
          </div>
          <JobReviewForm
            jobId={job.id}
            initialJob={jobReviewFields}
            key={`${job.id}-${job.updatedAt.toISOString()}`}
          />
        </>
      )}
    </section>
  );

  const matchPanel = extracted && !isBlockedByDuplicate ? (
    <ApplicationMatchPanel
      applicationId={application.id}
      blockReason={matchBlockReason}
      canMatch={jobReadyForMatch && hasResumeProfile}
      initialMatch={initialMatch}
    />
  ) : null;

  const emailPanel = extracted && !isBlockedByDuplicate ? (
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
  ) : null;

  const sendOutcomeUnknown = isSendOutcomeUnknown(application);
  const sendPanel = application.status === "SENDING" ? (
    <section className="settings-section" id="section-send">
      <p className="section-label">Send application</p>
      <ApplicationSendOutcomeBanner applicationId={application.id} outcomeUnknown={sendOutcomeUnknown} />
    </section>
  ) : extracted && selectedEmail && !isBlockedByDuplicate ? (
      <ApplicationSendPanel
        applicationId={application.id}
        applicationStatus={application.status}
        blockReason={sendBlockReason}
        canSend={
          gmailStatus.connected &&
          Boolean(application.resumeId) &&
          application.status === "READY"
        }
        duplicateApplications={duplicateSummaries}
        gmailConnected={gmailStatus.connected}
        resumeFileName={defaultResume?.fileName ?? null}
        resumeId={defaultResume?.id ?? null}
      />
    ) : null;

  const trackingPanel =
    isSentOrLater(application.status) ? (
      <>
        <ApplicationStatusPanel applicationId={application.id} currentStatus={application.status} />
        <ApplicationFollowUpPanel
          active={followUpActiveStatuses.some((status) => status === application.status)}
          applicationId={application.id}
          followUpAt={application.followUpAt?.toISOString() ?? null}
          followUpCompletedAt={application.followUpCompletedAt?.toISOString() ?? null}
          key={`${application.followUpAt?.toISOString() ?? "none"}-${application.updatedAt.toISOString()}`}
        />
        <ApplicationTimeline events={application.events} />
      </>
    ) : null;

  return (
    <AppShell activePath="" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Application</p>
      <h1>{job.title ?? "Review the job posting"}</h1>
      <p className="lede">
        {job.company ?? "Company not found"} · <strong>{application.status.replaceAll("_", " ")}</strong>
      </p>

      <ApplicationFlowShell
        nextAction={flow.nextAction}
        panels={{
          screenshot: screenshotPanel,
          "extract-review": extractReviewPanel,
          match: matchPanel,
          email: emailPanel,
          send: sendPanel,
        }}
        rail={
          <ApplicationContextRail
            facts={{
              jobId: job.id,
              screenshotFileName: job.screenshotStorageKey ? screenshotLabel(job.screenshotStorageKey) : null,
              company: job.company,
              title: job.title,
              recipient: job.applicationEmail,
              matchScore: application.matchScore,
              status: application.status,
              followUpAt: application.followUpAt,
              followUpCompletedAt: application.followUpCompletedAt,
            }}
          />
        }
        steps={flow.steps}
        tracking={trackingPanel}
      />
    </AppShell>
  );
}

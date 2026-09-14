import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { resumeProfileContentSchema } from "@/features/ai/resume-parsing.schema";
import { getGmailConnectionStatus } from "@/features/integrations/gmail/gmail.service";
import { getDefaultProfileForUser } from "@/features/resume/resume-profile.service";
import { GmailConnectPanel } from "./gmail-connect-panel";
import { ResumeParseButton } from "./resume-parse-button";
import { ResumeProfileReview } from "./resume-profile-review";
import { ResumeUploadForm } from "./resume-upload-form";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SettingsPage() {
  const user = await requireCurrentUser("/settings");
  const resumeBundle = await getDefaultProfileForUser(user.id);
  const resume = resumeBundle?.resume;
  const profile = resumeBundle?.profile;
  const parsedContent = profile?.content ? resumeProfileContentSchema.parse(profile.content) : null;
  const gmailStatus = await getGmailConnectionStatus(user.id);

  return (
    <AppShell activePath="/settings" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Settings</p>
      <h1>Set up your application profile.</h1>
      <p className="lede">
        You are signed in as {user.email}. Upload your resume, parse it into a structured profile, and review the facts
        ApplyFlow can use in applications.
      </p>

      <section aria-labelledby="resume-section" className="settings-section">
        <p className="section-label" id="resume-section">Resume</p>
        {resume ? (
          <div className="resume-card" role="status">
            <p className="resume-card-title">
              Current resume: <strong>{resume.fileName}</strong>
            </p>
            <p className="quiet-note">
              {formatFileSize(resume.byteSize)} · uploaded {resume.createdAt.toLocaleDateString()}
            </p>
            <ResumeParseButton hasProfile={Boolean(profile)} resumeId={resume.id} />
          </div>
        ) : (
          <div className="empty-card">
            <h2>Add the resume you want applications grounded on.</h2>
            <p>Your file stays private in Supabase Storage. After upload, parse it to create your profile.</p>
          </div>
        )}
        <ResumeUploadForm />
      </section>

      {resume && profile && parsedContent ? (
        <section className="settings-section">
          <ResumeProfileReview
            initialProfile={{
              fullName: profile.fullName,
              headline: profile.headline,
              email: profile.email,
              phone: profile.phone,
              location: profile.location,
              content: parsedContent,
            }}
            resumeId={resume.id}
          />
        </section>
      ) : resume ? (
        <section className="settings-section">
          <div className="empty-card">
            <h2>Parse your resume to review the profile.</h2>
            <p>ApplyFlow will extract contact details, skills, and experience without inventing missing facts.</p>
          </div>
        </section>
      ) : null}

      <Suspense fallback={null}>
        <GmailConnectPanel initialStatus={gmailStatus} />
      </Suspense>
    </AppShell>
  );
}

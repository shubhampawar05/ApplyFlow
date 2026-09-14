import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/features/auth/require-current-user";
import { listResumesForUser } from "@/features/resume/resume.repository";
import { ResumeUploadForm } from "./resume-upload-form";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SettingsPage() {
  const user = await requireCurrentUser("/settings");
  const resumes = await listResumesForUser(user.id);
  const defaultResume = resumes.find((resume) => resume.isDefault) ?? resumes[0];

  return (
    <AppShell activePath="/settings" userLabel={user.displayName ?? user.email}>
      <p className="eyebrow">Settings</p>
      <h1>Set up your application profile.</h1>
      <p className="lede">
        You are signed in as {user.email}. Upload the resume ApplyFlow should ground applications on. Gmail connection
        controls will be added in a later milestone.
      </p>

      <section aria-labelledby="resume-section" className="settings-section">
        <p className="section-label" id="resume-section">Resume</p>
        {defaultResume ? (
          <div className="resume-card" role="status">
            <p className="resume-card-title">
              Current resume: <strong>{defaultResume.fileName}</strong>
            </p>
            <p className="quiet-note">
              {formatFileSize(defaultResume.byteSize)} · uploaded {defaultResume.createdAt.toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="empty-card">
            <h2>Add the resume you want applications grounded on.</h2>
            <p>Your file stays private in Supabase Storage. Parsing and profile review come in the next step.</p>
          </div>
        )}
        <ResumeUploadForm />
      </section>
    </AppShell>
  );
}

import { mediaUrl } from "@/lib/media/urls";

export function ResumePreview({
  resumeId,
  fileName,
  mimeType,
}: {
  resumeId: string;
  fileName: string;
  mimeType: string;
}) {
  const src = mediaUrl("resume", resumeId);

  if (mimeType === "application/pdf") {
    return (
      <div className="resume-preview">
        <iframe className="resume-preview-frame" src={src} title={`Resume preview: ${fileName}`} />
        <p className="quiet-note">This PDF will attach when you send an application.</p>
      </div>
    );
  }

  return (
    <div className="file-preview-chip">
      <span aria-hidden="true" className="file-preview-icon">DOC</span>
      <div>
        <strong>{fileName}</strong>
        <p className="quiet-note">This Word document will attach when you send an application.</p>
      </div>
    </div>
  );
}

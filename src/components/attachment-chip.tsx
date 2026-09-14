// Purpose: compact visual chip for a file that will attach to an outgoing email.
// Constraints: presentational only; callers supply label and optional link.
import Link from "next/link";

export function AttachmentChip({
  fileName,
  href,
  label = "Resume attachment",
}: {
  fileName: string;
  href?: string;
  label?: string;
}) {
  const extension = fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  const content = (
    <>
      <span aria-hidden="true" className="attachment-chip-icon">{extension.slice(0, 3)}</span>
      <span className="attachment-chip-copy">
        <strong>{label}</strong>
        <span>{fileName}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link className="attachment-chip" href={href} target="_blank">
        {content}
      </Link>
    );
  }

  return <div className="attachment-chip">{content}</div>;
}

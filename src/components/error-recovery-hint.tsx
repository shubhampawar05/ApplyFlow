// Purpose: actionable recovery guidance shown below AI or upload error messages.
// Constraints: presentational only; callers supply message and optional action link.
import Link from "next/link";
import type { ReactNode } from "react";

export function ErrorRecoveryHint({
  children,
  href,
  linkLabel,
}: {
  children: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <p className="error-recovery-hint">
      {children}
      {href && linkLabel ? (
        <>
          {" "}
          <Link href={href}>{linkLabel}</Link>
        </>
      ) : null}
    </p>
  );
}

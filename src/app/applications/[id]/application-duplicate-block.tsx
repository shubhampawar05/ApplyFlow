// Purpose: block the application flow when a likely duplicate role is detected.
// Constraints: presentational only; duplicate list and blocking decision come from the server page.
import Link from "next/link";
import type { DuplicateApplicationSummary } from "@/features/applications/application-duplicate.service";

type DuplicateBlockItem = Omit<DuplicateApplicationSummary, "updatedAt"> & {
  updatedAt: string;
};

export function ApplicationDuplicateBlock({
  duplicates,
}: {
  duplicates: DuplicateBlockItem[];
}) {
  return (
    <section className="flow-section" id="section-duplicate-block">
      <div className="duplicate-warning duplicate-block" role="alert">
        <strong>Duplicate application stopped</strong>
        <p>
          This role matches an application you already have. We stopped here so ApplyFlow does not run match
          analysis, draft an email, or prepare another send for the same job.
        </p>
        <ul>
          {duplicates.map((duplicate) => (
            <li key={duplicate.id}>
              <Link href={`/applications/${duplicate.id}`}>
                {duplicate.job.title ?? "Untitled role"} at {duplicate.job.company ?? "Unknown company"} (
                {duplicate.status.replaceAll("_", " ")})
              </Link>
            </li>
          ))}
        </ul>
        <div className="panel-actions">
          <Link className="button secondary" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </div>
      <p className="quiet-note">
        If this is a different role, update the company or title below and save. The duplicate check runs again
        automatically.
      </p>
    </section>
  );
}

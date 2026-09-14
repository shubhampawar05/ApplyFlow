// Purpose: highlight the recommended next step on the application detail page.
// Constraints: presentational only; message and target section come from server-computed flow state.
import type { ApplicationFlowNextAction } from "@/features/applications/application-flow-state";

export function ApplicationNextAction({ action }: { action: ApplicationFlowNextAction }) {
  return (
    <div className="next-action-callout">
      <p>
        <strong>Next:</strong> {action.message}
      </p>
      <a className="next-action-link" href={`#${action.sectionId}`}>
        Go to step
      </a>
    </div>
  );
}

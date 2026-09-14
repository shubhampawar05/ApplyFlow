// Purpose: show the five-step application journey with completion and current-step states.
// Constraints: presentational only; step state computed server-side in application-flow-state.
import type { FlowStep } from "@/features/applications/application-flow-state";

export function ApplicationFlowStepper({ steps }: { steps: FlowStep[] }) {
  return (
    <div aria-label="Application progress" className="flow-stepper">
      {steps.map((step, index) => (
        <a
          className={`flow-step flow-step-${step.status}`}
          href={`#${step.sectionId}`}
          key={step.id}
        >
          <span className="flow-step-marker" aria-hidden="true">
            {step.status === "complete" ? "✓" : String(index + 1).padStart(2, "0")}
          </span>
          <span className="flow-step-copy">
            <strong>{step.label}</strong>
            {step.status === "current" ? <span className="flow-step-now">Current</span> : null}
          </span>
        </a>
      ))}
    </div>
  );
}

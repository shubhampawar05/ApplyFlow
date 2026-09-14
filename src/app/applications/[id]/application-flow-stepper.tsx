"use client";

// Purpose: show the five-step application journey with completion and current-step states.
// Constraints: presentational only; step state computed server-side in application-flow-state.
import type { FlowStep } from "@/features/applications/application-flow-state";
import { scrollToSection } from "@/lib/scroll-to-section";

export function ApplicationFlowStepper({ steps }: { steps: FlowStep[] }) {
  return (
    <div aria-label="Application progress" className="flow-stepper">
      {steps.map((step, index) => (
        <a
          className={`flow-step flow-step-${step.status}`}
          href={`#${step.sectionId}`}
          key={step.id}
          onClick={(event) => {
            event.preventDefault();
            scrollToSection(step.sectionId);
          }}
        >
          <span aria-hidden="true" className="flow-step-marker">
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

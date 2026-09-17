"use client";

// Purpose: reusable horizontal stepper showing complete, current, and upcoming steps.
// Constraints: presentational only; step state and navigation callbacks come from parents.

export type FlowStepperItem = {
  id: string;
  label: string;
  description?: string;
  status: "complete" | "current" | "upcoming";
};

type FlowStepperProps = {
  steps: FlowStepperItem[];
  activeStepId?: string;
  onStepSelect?: (stepId: string) => void;
  ariaLabel?: string;
};

function canSelectStep(step: FlowStepperItem) {
  return step.status === "complete" || step.status === "current";
}

export function FlowStepper({
  steps,
  activeStepId,
  onStepSelect,
  ariaLabel = "Application progress",
}: FlowStepperProps) {
  return (
    <ol aria-label={ariaLabel} className="flow-stepper">
      {steps.map((step, index) => {
        const selectable = canSelectStep(step) && Boolean(onStepSelect);
        const isActive = activeStepId === step.id;
        const marker =
          step.status === "complete" ? (
            <span aria-hidden="true" className="flow-step-check">✓</span>
          ) : (
            <span aria-hidden="true" className="flow-step-index">
              {String(index + 1).padStart(2, "0")}
            </span>
          );

        const className = [
          "flow-step",
          `flow-step-${step.status}`,
          isActive ? "flow-step-active" : "",
          step.status === "current" ? "flow-step-active" : "",
          selectable ? "flow-step-selectable" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const content = (
          <>
            <span className="flow-step-marker">{marker}</span>
            <span className="flow-step-copy">
              <strong>{step.label}</strong>
              {step.description ? <span className="flow-step-description">{step.description}</span> : null}
              {step.status === "current" ? <span className="flow-step-now">Current</span> : null}
              {step.status === "complete" ? <span className="flow-step-done">Done</span> : null}
              {step.status === "upcoming" ? <span className="flow-step-left">Up next</span> : null}
            </span>
          </>
        );

        if (selectable) {
          return (
            <li className={className} key={step.id}>
              <button
                aria-current={isActive ? "step" : undefined}
                className="flow-step-button"
                onClick={() => onStepSelect?.(step.id)}
                type="button"
              >
                {content}
              </button>
            </li>
          );
        }

        return (
          <li aria-disabled="true" className={className} key={step.id}>
            <div className="flow-step-button flow-step-button-static">{content}</div>
          </li>
        );
      })}
    </ol>
  );
}

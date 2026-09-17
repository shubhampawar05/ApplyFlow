"use client";

// Purpose: show only the current application step content while the stepper tracks done/current/upcoming.
// Constraints: no client-side step switching; completed step panels stay hidden; state comes from the server.
import { ReactNode } from "react";
import type { ApplicationFlowNextAction, FlowStep, FlowStepId } from "@/features/applications/application-flow-state";
import { FlowStepper } from "@/components/flow-stepper";

type ApplicationFlowShellProps = {
  steps: FlowStep[];
  nextAction: ApplicationFlowNextAction | null;
  panels: Partial<Record<FlowStepId, ReactNode>>;
  tracking?: ReactNode;
};

function getCurrentStepId(steps: FlowStep[]): FlowStepId {
  return steps.find((step) => step.status === "current")?.id ?? steps[steps.length - 1]?.id ?? "screenshot";
}

export function ApplicationFlowShell({ steps, nextAction, panels, tracking }: ApplicationFlowShellProps) {
  const currentStepId = getCurrentStepId(steps);
  const currentStep = steps.find((step) => step.id === currentStepId);
  const currentPanel = panels[currentStepId];
  const currentStepNumber = steps.findIndex((step) => step.id === currentStepId) + 1;

  const stepperItems = steps.map((step) => ({
    id: step.id,
    label: step.label,
    status: step.status,
  }));

  return (
    <div className="application-flow">
      <div className="application-flow-header">
        <FlowStepper steps={stepperItems} />

        {nextAction && currentStep?.status === "current" ? (
          <div className="next-action-callout">
            <p>
              <strong>Next:</strong> {nextAction.message}
            </p>
          </div>
        ) : null}
      </div>

      <div className="application-flow-panel">
        <div className="application-flow-panel-head">
          <p className="application-flow-step-count">
            Step {currentStepNumber} of {steps.length}
          </p>
          <h2 className="application-flow-step-title">{currentStep?.label}</h2>
        </div>

        <div className="application-flow-panel-body">
          {currentPanel ?? (
            <div className="empty-card">
              <h2>Finish the previous step first.</h2>
              <p>This stage unlocks once the earlier steps in the flow are complete.</p>
            </div>
          )}
        </div>
      </div>

      {tracking ? <div className="application-flow-tracking">{tracking}</div> : null}
    </div>
  );
}

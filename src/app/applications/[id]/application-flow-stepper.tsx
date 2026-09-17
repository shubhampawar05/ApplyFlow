"use client";

// Purpose: thin adapter from application flow state to the shared FlowStepper component.
// Constraints: presentational only; step state computed server-side in application-flow-state.
import { FlowStepper } from "@/components/flow-stepper";
import type { FlowStep } from "@/features/applications/application-flow-state";

export function ApplicationFlowStepper({
  steps,
  activeStepId,
  onStepSelect,
}: {
  steps: FlowStep[];
  activeStepId?: string;
  onStepSelect?: (stepId: string) => void;
}) {
  return (
    <FlowStepper
      activeStepId={activeStepId}
      onStepSelect={onStepSelect}
      steps={steps.map((step) => ({
        id: step.id,
        label: step.label,
        status: step.status,
      }))}
    />
  );
}

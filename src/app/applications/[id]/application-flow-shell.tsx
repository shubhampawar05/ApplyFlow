"use client";

// Purpose: step-by-step application layout with sticky stepper and navigation across completed steps.
// Constraints: upcoming steps stay locked; server still owns step completion state.
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationFlowNextAction, FlowStep, FlowStepId } from "@/features/applications/application-flow-state";
import { FlowStepper } from "@/components/flow-stepper";
import {
  ApplicationFlowNavigationContext,
  getNextFlowStepId,
} from "./application-flow-navigation";

type ApplicationFlowShellProps = {
  steps: FlowStep[];
  nextAction: ApplicationFlowNextAction | null;
  panels: Partial<Record<FlowStepId, ReactNode>>;
  tracking?: ReactNode;
};

function getCurrentStepId(steps: FlowStep[]) {
  return steps.find((step) => step.status === "current")?.id ?? steps[steps.length - 1]?.id ?? "screenshot";
}

function canViewStep(steps: FlowStep[], stepId: FlowStepId) {
  const step = steps.find((item) => item.id === stepId);
  return step?.status === "complete" || step?.status === "current";
}

function buildStepStateKey(steps: FlowStep[]) {
  return steps.map((step) => `${step.id}:${step.status}`).join("|");
}

export function ApplicationFlowShell({ steps, nextAction, panels, tracking }: ApplicationFlowShellProps) {
  const serverCurrentStepId = getCurrentStepId(steps);
  const stepStateKey = useMemo(() => buildStepStateKey(steps), [steps]);
  const [viewingStepId, setViewingStepId] = useState<FlowStepId>(serverCurrentStepId);

  useEffect(() => {
    setViewingStepId(serverCurrentStepId);
  }, [serverCurrentStepId, stepStateKey]);

  const goToStep = useCallback(
    (stepId: FlowStepId) => {
      if (!canViewStep(steps, stepId)) {
        return;
      }

      setViewingStepId(stepId);
    },
    [steps],
  );

  const continueAfterStep = useCallback(
    (completedStepId: FlowStepId) => {
      const nextStepId = getNextFlowStepId(completedStepId);
      if (nextStepId) {
        setViewingStepId(nextStepId);
        return;
      }

      setViewingStepId(getCurrentStepId(steps));
    },
    [steps],
  );

  const viewingStep = steps.find((step) => step.id === viewingStepId);
  const viewingPanel = panels[viewingStepId];
  const viewingStepNumber = steps.findIndex((step) => step.id === viewingStepId) + 1;
  const isViewingCurrentStep = viewingStepId === serverCurrentStepId;
  const isBrowsingCompletedStep = Boolean(viewingStep?.status === "complete" && !isViewingCurrentStep);

  const stepperItems = steps.map((step) => ({
    id: step.id,
    label: step.label,
    status: step.status,
  }));

  const navigation = useMemo(
    () => ({
      goToStep,
      continueAfterStep,
    }),
    [goToStep, continueAfterStep],
  );

  return (
    <ApplicationFlowNavigationContext.Provider value={navigation}>
      <div className="application-flow">
        <div className="application-flow-header">
          <FlowStepper activeStepId={viewingStepId} onStepSelect={goToStep} steps={stepperItems} />

          {isBrowsingCompletedStep ? (
            <div className="flow-viewing-note">
              <p>
                You are reviewing a completed step. Changes here still save, but your current step is{" "}
                {steps.find((step) => step.id === serverCurrentStepId)?.label ?? "ahead"}.
              </p>
              <button className="next-action-link" onClick={() => goToStep(serverCurrentStepId)} type="button">
                Return to current step
              </button>
            </div>
          ) : null}

          {nextAction && isViewingCurrentStep && viewingStep?.status === "current" ? (
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
              Step {viewingStepNumber} of {steps.length}
            </p>
            <h2 className="application-flow-step-title">{viewingStep?.label}</h2>
          </div>

          <div className="application-flow-panel-body">
            {viewingPanel ?? (
              <div className="empty-card">
                <h2>Finish the previous step first.</h2>
                <p>This stage unlocks once the earlier steps in the flow are complete.</p>
              </div>
            )}
          </div>
        </div>

        {tracking ? <div className="application-flow-tracking">{tracking}</div> : null}
      </div>
    </ApplicationFlowNavigationContext.Provider>
  );
}

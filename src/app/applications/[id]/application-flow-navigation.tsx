"use client";

// Purpose: let step panels advance the application flow UI after save, skip, or continue actions.
// Constraints: client navigation only; step completion state still comes from the server.
import { createContext, useContext } from "react";
import type { FlowStepId } from "@/features/applications/application-flow-state";

export const FLOW_STEP_ORDER: FlowStepId[] = ["screenshot", "extract-review", "match", "email", "send"];

type ApplicationFlowNavigationContextValue = {
  goToStep: (stepId: FlowStepId) => void;
  continueAfterStep: (completedStepId: FlowStepId) => void;
};

export const ApplicationFlowNavigationContext = createContext<ApplicationFlowNavigationContextValue | null>(null);

export function useApplicationFlowNavigation() {
  const context = useContext(ApplicationFlowNavigationContext);
  if (!context) {
    throw new Error("useApplicationFlowNavigation must be used within ApplicationFlowShell.");
  }

  return context;
}

export function getNextFlowStepId(stepId: FlowStepId): FlowStepId | null {
  const index = FLOW_STEP_ORDER.indexOf(stepId);
  if (index < 0 || index >= FLOW_STEP_ORDER.length - 1) {
    return null;
  }

  return FLOW_STEP_ORDER[index + 1];
}

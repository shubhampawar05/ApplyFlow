// Purpose: derive application detail flow stepper state and next-action guidance.
// Constraints: pure functions only; no React or persistence logic.

export type FlowStepId = "screenshot" | "extract-review" | "match" | "email" | "send";

export type FlowStepStatus = "complete" | "current" | "upcoming";

export type FlowStep = {
  id: FlowStepId;
  label: string;
  sectionId: string;
  status: FlowStepStatus;
};

export type ApplicationFlowNextAction = {
  message: string;
  sectionId: string;
};

const FLOW_STEP_DEFINITIONS: Array<{ id: FlowStepId; label: string; sectionId: string }> = [
  { id: "screenshot", label: "Screenshot", sectionId: "section-screenshot" },
  { id: "extract-review", label: "Extract & review", sectionId: "section-job-review" },
  { id: "match", label: "Match", sectionId: "section-match" },
  { id: "email", label: "Email", sectionId: "section-email" },
  { id: "send", label: "Send", sectionId: "section-send" },
];

function isEmailStepComplete(status: string) {
  return status === "READY" || status === "SENT";
}

export function getApplicationFlowState(input: {
  hasScreenshot: boolean;
  extracted: boolean;
  hasMatch: boolean;
  hasEmailDraft: boolean;
  status: string;
}) {
  const completions = [
    input.hasScreenshot,
    input.extracted,
    input.hasMatch,
    isEmailStepComplete(input.status),
    input.status === "SENT",
  ];

  const firstIncompleteIndex = completions.findIndex((complete) => !complete);
  const currentIndex = firstIncompleteIndex === -1 ? completions.length - 1 : firstIncompleteIndex;

  const steps: FlowStep[] = FLOW_STEP_DEFINITIONS.map((definition, index) => {
    let status: FlowStepStatus = "upcoming";
    if (completions[index]) {
      status = "complete";
    } else if (index === currentIndex) {
      status = "current";
    }

    return { ...definition, status };
  });

  const nextAction = getNextAction({
    currentStepId: steps[currentIndex]?.id ?? "send",
    extracted: input.extracted,
    hasMatch: input.hasMatch,
    hasEmailDraft: input.hasEmailDraft,
    status: input.status,
  });

  return { steps, nextAction };
}

function getNextAction(input: {
  currentStepId: FlowStepId;
  extracted: boolean;
  hasMatch: boolean;
  hasEmailDraft: boolean;
  status: string;
}): ApplicationFlowNextAction | null {
  if (input.status === "SENT") {
    return null;
  }

  switch (input.currentStepId) {
    case "screenshot":
      return {
        message: "Upload a job screenshot to begin this application.",
        sectionId: "section-screenshot",
      };
    case "extract-review":
      return {
        message: input.extracted
          ? "Review the extracted job details and save any corrections."
          : "Extract job details from your screenshot.",
        sectionId: input.extracted ? "section-job-review" : "section-screenshot",
      };
    case "match":
      return {
        message: "Compare your resume against this role.",
        sectionId: "section-match",
      };
    case "email":
      return {
        message: input.hasEmailDraft
          ? "Review your email draft and save it to mark the application ready."
          : "Generate and save your application email draft.",
        sectionId: "section-email",
      };
    case "send":
      return {
        message: "Review your draft and send the application through Gmail.",
        sectionId: "section-send",
      };
    default:
      return null;
  }
}

import { describe, expect, it } from "vitest";
import { getApplicationFlowState } from "@/features/applications/application-flow-state";

describe("getApplicationFlowState", () => {
  it("marks screenshot complete and extract as current for a fresh draft", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: false,
      hasMatch: false,
      hasEmailDraft: false,
      status: "DRAFT",
    });

    expect(flow.steps[0]?.status).toBe("complete");
    expect(flow.steps[1]?.status).toBe("current");
    expect(flow.nextAction?.sectionId).toBe("section-screenshot");
  });

  it("moves to match after extraction is complete", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      hasMatch: false,
      hasEmailDraft: false,
      status: "ANALYZED",
    });

    expect(flow.steps[1]?.status).toBe("complete");
    expect(flow.steps[2]?.status).toBe("current");
    expect(flow.nextAction?.message).toContain("Compare your resume");
  });

  it("hides next action after send", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      hasMatch: true,
      hasEmailDraft: true,
      status: "SENT",
    });

    expect(flow.steps.every((step) => step.status === "complete")).toBe(true);
    expect(flow.nextAction).toBeNull();
  });
});

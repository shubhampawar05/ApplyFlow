import { describe, expect, it } from "vitest";
import {
  getApplicationFlowState,
  isJobReviewStepComplete,
  isMatchStepComplete,
} from "@/features/applications/application-flow-state";

describe("isMatchStepComplete", () => {
  it("returns true when match was skipped", () => {
    expect(isMatchStepComplete([{ type: "MATCH_SKIPPED" }])).toBe(true);
  });
});

describe("isJobReviewStepComplete", () => {
  it("returns true when job review was saved", () => {
    expect(
      isJobReviewStepComplete({
        events: [{ type: "JOB_REVIEW_SAVED" }],
        hasEmailDraft: false,
        status: "ANALYZED",
      }),
    ).toBe(true);
  });
});

describe("getApplicationFlowState", () => {
  it("marks screenshot complete and extract as current for a fresh draft", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: false,
      jobReviewComplete: false,
      hasMatch: false,
      hasEmailDraft: false,
      status: "DRAFT",
    });

    expect(flow.steps[0]?.status).toBe("complete");
    expect(flow.steps[1]?.status).toBe("current");
    expect(flow.nextAction?.sectionId).toBe("section-screenshot");
  });

  it("keeps extract-review current after extraction until job review is saved", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      jobReviewComplete: false,
      hasMatch: false,
      hasEmailDraft: false,
      status: "ANALYZED",
    });

    expect(flow.steps[1]?.status).toBe("current");
    expect(flow.steps[2]?.status).toBe("upcoming");
    expect(flow.nextAction?.message).toContain("Review");
  });

  it("keeps email current after draft generation until saved as ready", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      jobReviewComplete: true,
      hasMatch: true,
      hasEmailDraft: true,
      status: "ANALYZED",
    });

    expect(flow.steps[3]?.status).toBe("current");
    expect(flow.steps[4]?.status).toBe("upcoming");
  });

  it("moves to send after email draft is saved ready", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      jobReviewComplete: true,
      hasMatch: true,
      hasEmailDraft: true,
      status: "READY",
    });

    expect(flow.steps[3]?.status).toBe("complete");
    expect(flow.steps[4]?.status).toBe("current");
  });

  it("moves to match after job review is saved", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      jobReviewComplete: true,
      hasMatch: false,
      hasEmailDraft: false,
      status: "ANALYZED",
    });

    expect(flow.steps[1]?.status).toBe("complete");
    expect(flow.steps[2]?.status).toBe("current");
    expect(flow.nextAction?.message).toContain("Compare your resume");
  });

  it("keeps extract-review current when blocked by duplicate", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      jobReviewComplete: false,
      hasMatch: false,
      hasEmailDraft: false,
      status: "ANALYZED",
      blockedByDuplicate: true,
    });

    expect(flow.steps[1]?.status).toBe("current");
    expect(flow.steps[2]?.status).toBe("upcoming");
    expect(flow.nextAction?.sectionId).toBe("section-duplicate-block");
  });

  it("hides next action after send", () => {
    const flow = getApplicationFlowState({
      hasScreenshot: true,
      extracted: true,
      jobReviewComplete: true,
      hasMatch: true,
      hasEmailDraft: true,
      status: "SENT",
    });

    expect(flow.steps.every((step) => step.status === "complete")).toBe(true);
    expect(flow.nextAction).toBeNull();
  });
});

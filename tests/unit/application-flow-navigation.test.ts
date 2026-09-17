import { describe, expect, it } from "vitest";
import { getNextFlowStepId } from "@/app/applications/[id]/application-flow-navigation";

describe("getNextFlowStepId", () => {
  it("returns the next step in the application flow", () => {
    expect(getNextFlowStepId("extract-review")).toBe("match");
    expect(getNextFlowStepId("email")).toBe("send");
  });

  it("returns null after the final step", () => {
    expect(getNextFlowStepId("send")).toBeNull();
  });
});

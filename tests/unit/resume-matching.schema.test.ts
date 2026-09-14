import { describe, expect, it } from "vitest";
import { sanitizeResumeMatchingOutput } from "@/features/ai/resume-matching.schema";

describe("sanitizeResumeMatchingOutput", () => {
  it("clamps score and normalizes list fields", () => {
    const parsed = sanitizeResumeMatchingOutput({
      score: 128.7,
      summary: "Strong backend alignment.",
      strengths: [" 5 years Node.js ", ""],
      gaps: ["No Kubernetes evidence"],
      matchedSkills: ["TypeScript", "Node.js"],
      missingSkills: ["Kubernetes"],
    });

    expect(parsed).toMatchObject({
      score: 100,
      summary: "Strong backend alignment.",
      strengths: ["5 years Node.js"],
      gaps: ["No Kubernetes evidence"],
      matchedSkills: ["TypeScript", "Node.js"],
      missingSkills: ["Kubernetes"],
    });
  });

  it("provides a default summary when missing", () => {
    const parsed = sanitizeResumeMatchingOutput({
      score: 42,
      summary: "",
      strengths: [],
      gaps: [],
      matchedSkills: [],
      missingSkills: [],
    });

    expect(parsed.summary).toBe("Match analysis completed.");
    expect(parsed.score).toBe(42);
  });
});

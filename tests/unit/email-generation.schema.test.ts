import { describe, expect, it } from "vitest";
import { emailPatchSchema, sanitizeEmailGenerationOutput } from "@/features/ai/email-generation.schema";

describe("email generation schema", () => {
  it("sanitizes subject and body lengths", () => {
    const parsed = sanitizeEmailGenerationOutput({
      subject: "  Application for Backend Engineer ",
      body: "Hello,\n\nI would like to apply.",
    });

    expect(parsed.subject).toBe("Application for Backend Engineer");
    expect(parsed.body).toContain("I would like to apply.");
  });

  it("requires at least one field in email patch", () => {
    expect(() => emailPatchSchema.parse({})).toThrow();
    expect(emailPatchSchema.parse({ subject: "Updated subject" }).subject).toBe("Updated subject");
  });
});

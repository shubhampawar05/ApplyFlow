import { describe, expect, it } from "vitest";
import { isLikelyDuplicate, normalizeJobIdentity, prepareJobDraft } from "@/features/jobs/job.service";

describe("prepareJobDraft", () => {
  it("normalizes identity fields without changing the user-facing job data", () => {
    const draft = prepareJobDraft({
      company: "  ACME, Inc. ",
      title: "Senior — Platform Engineer",
      applicationEmail: "CAREERS@ACME.COM ",
      skills: ["TypeScript"],
    });

    expect(draft.company).toBe("ACME, Inc.");
    expect(draft.applicationEmail).toBe("careers@acme.com");
    expect(draft.normalized).toEqual({
      company: "acme inc",
      title: "senior platform engineer",
      applicationEmail: "careers@acme.com",
    });
  });

  it("keeps unknown extraction fields null instead of inventing a value", () => {
    const draft = prepareJobDraft({ company: "Acme", title: "Developer" });

    expect(draft.applicationEmail).toBeNull();
    expect(draft.location).toBeUndefined();
  });
});

describe("normalizeJobIdentity", () => {
  it("normalizes punctuation, casing, and whitespace consistently", () => {
    expect(normalizeJobIdentity({ company: "North  Star!", title: "  Product Lead ", applicationEmail: null })).toEqual({
      company: "north star",
      title: "product lead",
      applicationEmail: null,
    });
  });
});

describe("isLikelyDuplicate", () => {
  const base = { company: "acme", title: "designer", applicationEmail: "jobs@acme.com" };

  it("warns when all available identity fields match", () => {
    expect(isLikelyDuplicate(base, base)).toBe(true);
  });

  it("does not treat different recipient addresses as a duplicate", () => {
    expect(isLikelyDuplicate(base, { ...base, applicationEmail: "team@acme.com" })).toBe(false);
  });

  it("does not claim a duplicate when company or title is unknown", () => {
    expect(isLikelyDuplicate({ ...base, title: null }, base)).toBe(false);
  });
});

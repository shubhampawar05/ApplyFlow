import { describe, expect, it } from "vitest";
import { sanitizeJobExtractionOutput } from "@/features/jobs/job-extraction.schema";

describe("sanitizeJobExtractionOutput", () => {
  it("coerces empty strings and invalid contact fields to null", () => {
    const parsed = sanitizeJobExtractionOutput({
      company: "Thrifty AI",
      title: "Full Stack Developer",
      location: "",
      employmentType: null,
      experience: null,
      applicationEmail: "Easy Apply",
      applicationUrl: "not a url",
      skills: [],
      description: null,
      salary: null,
      source: "LinkedIn",
      deadline: null,
      confidence: 0.9,
    });

    expect(parsed).toMatchObject({
      company: "Thrifty AI",
      title: "Full Stack Developer",
      location: null,
      applicationEmail: null,
      applicationUrl: null,
      skills: [],
      source: "LinkedIn",
      confidence: 0.9,
    });
  });

  it("normalizes partial URLs and comma-separated skills", () => {
    const parsed = sanitizeJobExtractionOutput({
      company: "Acme",
      title: "Engineer",
      location: null,
      employmentType: null,
      experience: null,
      skills: ["React", "Node.js"],
      description: null,
      salary: null,
      applicationEmail: null,
      applicationUrl: "linkedin.com/jobs/view/123",
      source: null,
      deadline: null,
      confidence: null,
    });

    expect(parsed.applicationUrl).toBe("https://linkedin.com/jobs/view/123");
    expect(parsed.skills).toEqual(["React", "Node.js"]);
  });

  it("accepts plain strings from the model schema without OpenAI format errors", () => {
    const parsed = sanitizeJobExtractionOutput({
      company: "Acme",
      title: "Engineer",
      location: "Remote",
      employmentType: "Full-time",
      experience: "3+ years",
      skills: ["TypeScript"],
      description: "Build APIs.",
      salary: "₹12–18 LPA",
      applicationEmail: "careers@acme.com",
      applicationUrl: "https://acme.com/jobs/engineer",
      source: "Indeed",
      deadline: "2026-12-31",
      confidence: 0.85,
    });

    expect(parsed.applicationEmail).toBe("careers@acme.com");
    expect(parsed.deadline).toEqual(new Date("2026-12-31"));
  });
});

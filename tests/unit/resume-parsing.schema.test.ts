import { describe, expect, it } from "vitest";
import { resumeParsingOutputSchema } from "@/features/ai/resume-parsing.schema";
import { toProfileUpsertData } from "@/features/resume/resume-profile.mapper";

describe("resume parsing schema", () => {
  it("accepts grounded profile output with nullable unknowns", () => {
    const parsed = resumeParsingOutputSchema.parse({
      fullName: "Alex Example",
      headline: "Platform Engineer",
      email: "alex@example.com",
      phone: null,
      location: "Bengaluru",
      content: {
        summary: "Backend engineer with platform experience.",
        skills: ["TypeScript", "PostgreSQL"],
        experience: [
          {
            title: "Software Engineer",
            company: "Acme",
            highlights: ["Built internal APIs"],
          },
        ],
        education: [],
      },
    });

    expect(toProfileUpsertData(parsed).email).toBe("alex@example.com");
    expect(toProfileUpsertData(parsed).content.skills).toEqual(["TypeScript", "PostgreSQL"]);
  });

  it("rejects invented contact details without valid email format", () => {
    expect(() =>
      resumeParsingOutputSchema.parse({
        fullName: "Alex Example",
        email: "not-an-email",
        content: { skills: [], experience: [], education: [] },
      }),
    ).toThrow();
  });
});

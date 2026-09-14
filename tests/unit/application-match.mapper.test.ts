import { describe, expect, it } from "vitest";
import { toJobMatchInput, toResumeMatchInput } from "@/features/applications/application-match.mapper";

describe("application match mappers", () => {
  it("maps job fields into a JSON-safe snapshot", () => {
    const snapshot = toJobMatchInput({
      id: "job-1",
      userId: "user-1",
      sourceType: "SCREENSHOT",
      screenshotStorageKey: "jobs/user-1/file.png",
      company: "Acme",
      normalizedCompany: "acme",
      title: "Engineer",
      normalizedTitle: "engineer",
      location: "Remote",
      employmentType: "Full-time",
      experience: "3+ years",
      skills: ["TypeScript"],
      description: "Build APIs",
      salary: null,
      applicationEmail: "jobs@acme.com",
      normalizedApplicationEmail: "jobs@acme.com",
      applicationUrl: "https://acme.com/jobs/1",
      source: "LinkedIn",
      deadline: new Date("2026-10-01T00:00:00.000Z"),
      extractionConfidence: 0.9,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(snapshot.company).toBe("Acme");
    expect(snapshot.deadline).toBe("2026-10-01T00:00:00.000Z");
  });

  it("maps resume profile fields into a JSON-safe snapshot", () => {
    const snapshot = toResumeMatchInput({
      id: "profile-1",
      resumeId: "resume-1",
      fullName: "Jane Doe",
      headline: "Backend engineer",
      email: "jane@example.com",
      phone: null,
      location: "Pune",
      content: { skills: ["TypeScript"], experience: [], education: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(snapshot.fullName).toBe("Jane Doe");
  });
});

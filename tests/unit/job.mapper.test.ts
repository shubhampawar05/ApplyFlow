import type { Job } from "@/generated/prisma";
import { describe, expect, it } from "vitest";
import { jobDraftToUpdateData, jobRecordToDraftInput } from "@/features/jobs/job.mapper";
import { prepareJobDraft } from "@/features/jobs/job.service";

describe("job mapper", () => {
  it("maps persisted job records into draft input", () => {
    const job = {
      id: "job-1",
      userId: "user-1",
      sourceType: "SCREENSHOT",
      screenshotStorageKey: "users/u1/jobs/screenshots/a/shot.png",
      company: "Thrifty AI",
      normalizedCompany: "thrifty ai",
      title: "Full Stack Developer",
      normalizedTitle: "full stack developer",
      location: "Noida",
      employmentType: "Full-time",
      experience: "2-4 years",
      skills: ["React", "Node.js"],
      description: "Build product features.",
      salary: null,
      applicationEmail: "hr@thriftyai.com",
      normalizedApplicationEmail: "hr@thriftyai.com",
      applicationUrl: null,
      source: "LinkedIn",
      deadline: null,
      extractionConfidence: 0.92,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Job;

    expect(jobRecordToDraftInput(job)).toEqual({
      company: "Thrifty AI",
      title: "Full Stack Developer",
      location: "Noida",
      employmentType: "Full-time",
      experience: "2-4 years",
      skills: ["React", "Node.js"],
      description: "Build product features.",
      salary: null,
      applicationEmail: "hr@thriftyai.com",
      applicationUrl: null,
      source: "LinkedIn",
      deadline: null,
      confidence: 0.92,
    });
  });

  it("maps prepared drafts into prisma update data", () => {
    const draft = prepareJobDraft({
      company: "Thrifty AI",
      title: "Full Stack Developer",
      applicationEmail: "HR@THRIFTYAI.COM",
      skills: ["React"],
    });

    expect(jobDraftToUpdateData(draft)).toMatchObject({
      company: "Thrifty AI",
      normalizedCompany: "thrifty ai",
      title: "Full Stack Developer",
      normalizedTitle: "full stack developer",
      applicationEmail: "hr@thriftyai.com",
      normalizedApplicationEmail: "hr@thriftyai.com",
      skills: ["React"],
    });
  });
});

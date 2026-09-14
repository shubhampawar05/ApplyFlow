import { z } from "zod";

const optionalText = z.string().trim().min(1).max(5_000).nullable().optional();

export const jobDraftSchema = z.object({
  company: z.string().trim().min(1).max(160).nullable().optional(),
  title: z.string().trim().min(1).max(200).nullable().optional(),
  location: z.string().trim().min(1).max(200).nullable().optional(),
  employmentType: z.string().trim().min(1).max(80).nullable().optional(),
  experience: z.string().trim().min(1).max(160).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  description: optionalText,
  salary: z.string().trim().min(1).max(160).nullable().optional(),
  applicationEmail: z.string().trim().email().max(320).nullable().optional(),
  applicationUrl: z.string().trim().url().max(2_000).nullable().optional(),
  source: z.string().trim().min(1).max(160).nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export type JobDraftInput = z.input<typeof jobDraftSchema>;
export type JobDraft = z.output<typeof jobDraftSchema>;

export const jobPatchSchema = jobDraftSchema.partial().refine(
  (patch) => Object.values(patch).some((value) => value !== undefined),
  "Provide at least one field to update.",
);

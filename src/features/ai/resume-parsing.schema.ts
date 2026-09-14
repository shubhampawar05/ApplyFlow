import { z } from "zod";

export const resumeExperienceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200).nullable().optional(),
  startDate: z.string().trim().min(1).max(40).nullable().optional(),
  endDate: z.string().trim().min(1).max(40).nullable().optional(),
  highlights: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
});

export const resumeEducationSchema = z.object({
  school: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(200).nullable().optional(),
  endDate: z.string().trim().min(1).max(40).nullable().optional(),
});

export const resumeProfileContentSchema = z.object({
  summary: z.string().trim().min(1).max(4_000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  experience: z.array(resumeExperienceSchema).max(20).default([]),
  education: z.array(resumeEducationSchema).max(12).default([]),
});

export const resumeParsingOutputSchema = z.object({
  fullName: z.string().trim().min(1).max(160).nullable(),
  headline: z.string().trim().min(1).max(240).nullable().optional(),
  email: z.string().trim().email().max(320).nullable().optional(),
  phone: z.string().trim().min(3).max(40).nullable().optional(),
  location: z.string().trim().min(1).max(160).nullable().optional(),
  content: resumeProfileContentSchema,
});

export const resumeProfilePatchSchema = z
  .object({
    fullName: z.string().trim().min(1).max(160).nullable().optional(),
    headline: z.string().trim().min(1).max(240).nullable().optional(),
    email: z.string().trim().email().max(320).nullable().optional(),
    phone: z.string().trim().min(3).max(40).nullable().optional(),
    location: z.string().trim().min(1).max(160).nullable().optional(),
    content: resumeProfileContentSchema.partial().optional(),
  })
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });

export type ResumeParsingOutput = z.infer<typeof resumeParsingOutputSchema>;
export type ResumeProfileContent = z.infer<typeof resumeProfileContentSchema>;
export type ResumeProfilePatch = z.infer<typeof resumeProfilePatchSchema>;

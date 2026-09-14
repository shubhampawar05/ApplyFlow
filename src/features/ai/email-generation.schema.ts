// Purpose: Zod schemas and sanitization for AI application email generation output.
// Constraints: bounded subject/body lengths; no orchestration or persistence logic.
import { z } from "zod";

export const emailGenerationOutputSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(15_000),
});

export type EmailGenerationOutput = z.infer<typeof emailGenerationOutputSchema>;

export const emailPatchSchema = z
  .object({
    subject: z.string().trim().min(1).max(300).optional(),
    body: z.string().trim().min(1).max(15_000).optional(),
  })
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });

export type EmailPatch = z.infer<typeof emailPatchSchema>;

export function sanitizeEmailGenerationOutput(input: z.input<typeof emailGenerationOutputSchema>): EmailGenerationOutput {
  const subject = typeof input.subject === "string" ? input.subject.trim().slice(0, 300) : "";
  const body = typeof input.body === "string" ? input.body.trim().slice(0, 15_000) : "";

  return emailGenerationOutputSchema.parse({
    subject: subject || "Application for open role",
    body: body || "Hello,\n\nI am interested in this role and would welcome the chance to discuss my background.\n\nThank you.",
  });
}

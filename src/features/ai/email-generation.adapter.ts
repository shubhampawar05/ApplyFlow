// Purpose: call OpenAI and return schema-validated application email draft output.
// Constraints: bump EMAIL_GENERATION_PROMPT_VERSION when prompt or model changes; never fabricate candidate facts.
import { zodResponseFormat } from "openai/helpers/zod";
import {
  emailGenerationOutputSchema,
  sanitizeEmailGenerationOutput,
  type EmailGenerationOutput,
} from "./email-generation.schema";
import { getOpenAiClient } from "@/lib/openai/client";

export const EMAIL_GENERATION_PROMPT_VERSION = "email-generation-v1";
const EMAIL_GENERATION_MODEL = "gpt-4o-mini";

const systemPrompt = `You draft a concise, professional job-application email for a candidate.

Rules:
- Use only facts from the provided resume profile. Never invent employers, degrees, skills, years of experience, or achievements.
- Reference the job company/title naturally when those fields are available.
- Keep the tone warm, direct, and human — not overly formal or salesy.
- Write a clear subject line and a body suitable for email (plain text, short paragraphs).
- Do not include placeholders like [Your Name]; use the candidate name from the resume when available.
- Do not mention AI, automation, or that this was generated.
- If match analysis is provided, emphasize relevant strengths without exaggerating fit.
- End with a simple closing and the candidate name when known.`;

export async function generateApplicationEmail(input: {
  job: Record<string, unknown>;
  resumeProfile: Record<string, unknown>;
  matchAnalysis?: Record<string, unknown> | null;
}): Promise<EmailGenerationOutput> {
  const client = getOpenAiClient();
  const completion = await client.chat.completions.parse({
    model: EMAIL_GENERATION_MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Draft an application email using this context.\n\nJob:\n${JSON.stringify(input.job, null, 2)}\n\nResume profile:\n${JSON.stringify(input.resumeProfile, null, 2)}\n\nMatch analysis:\n${JSON.stringify(input.matchAnalysis ?? null, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(emailGenerationOutputSchema, "application_email"),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    const refusal = completion.choices[0]?.message?.refusal;
    throw new Error(refusal ? `AI_EMAIL_REFUSED:${refusal.slice(0, 80)}` : "AI_EMAIL_EMPTY");
  }

  return sanitizeEmailGenerationOutput(emailGenerationOutputSchema.parse(parsed));
}

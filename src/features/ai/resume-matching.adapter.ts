// Purpose: call OpenAI and return schema-validated resume/job match output.
// Constraints: bump RESUME_MATCHING_PROMPT_VERSION when prompt or model changes; only compare provided facts.
import { zodResponseFormat } from "openai/helpers/zod";
import {
  resumeMatchingOutputSchema,
  sanitizeResumeMatchingOutput,
  type ResumeMatchingOutput,
} from "./resume-matching.schema";
import { getOpenAiClient } from "@/lib/openai/client";

export const RESUME_MATCHING_PROMPT_VERSION = "resume-matching-v1";
const RESUME_MATCHING_MODEL = "gpt-4o-mini";

const systemPrompt = `You compare a structured resume profile against structured job requirements for a job-application assistant.

Rules:
- Score fit from 0 to 100 based only on evidence in the resume profile.
- strengths must cite resume-backed alignment with the job.
- gaps must describe job requirements not clearly supported by the resume.
- matchedSkills must be job skills or requirements that appear in the resume.
- missingSkills must be job skills or requirements not evidenced in the resume.
- Do not invent resume experience, skills, degrees, or contact details.
- If job fields are sparse, score conservatively and explain uncertainty in summary.`;

export async function matchResumeToJob(input: {
  job: Record<string, unknown>;
  resumeProfile: Record<string, unknown>;
}): Promise<ResumeMatchingOutput> {
  const client = getOpenAiClient();
  const completion = await client.chat.completions.parse({
    model: RESUME_MATCHING_MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Compare this resume profile to this job posting and return a match analysis.\n\nJob:\n${JSON.stringify(input.job, null, 2)}\n\nResume profile:\n${JSON.stringify(input.resumeProfile, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(resumeMatchingOutputSchema, "resume_job_match"),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    const refusal = completion.choices[0]?.message?.refusal;
    throw new Error(refusal ? `AI_MATCH_REFUSED:${refusal.slice(0, 80)}` : "AI_MATCH_EMPTY");
  }

  return sanitizeResumeMatchingOutput(resumeMatchingOutputSchema.parse(parsed));
}

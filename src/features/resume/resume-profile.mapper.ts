import type { ResumeParsingOutput } from "@/features/ai/resume-parsing.schema";

export function toProfileUpsertData(parsed: ResumeParsingOutput) {
  return {
    fullName: parsed.fullName,
    headline: parsed.headline ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    location: parsed.location ?? null,
    content: parsed.content,
  };
}

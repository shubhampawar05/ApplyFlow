// Purpose: Zod schemas for application list queries, status updates, and follow-ups.
// Constraints: schema definitions only; no persistence or HTTP handling.
import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "DRAFT",
  "ANALYZED",
  "READY",
  "SENDING",
  "SENT",
  "FOLLOW_UP",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "CLOSED",
]);

export const postSendStatuses = ["SENT", "FOLLOW_UP", "INTERVIEW", "REJECTED", "OFFER", "CLOSED"] as const;

const postSendStatusSet = new Set<string>(postSendStatuses);

export function isSentOrLater(status: string) {
  return postSendStatusSet.has(status);
}

export const userSettablePostSendStatuses = ["FOLLOW_UP", "INTERVIEW", "REJECTED", "OFFER", "CLOSED"] as const;

export const applicationStatusPatchSchema = z.object({
  status: z.enum(userSettablePostSendStatuses),
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationStatusPatch = z.infer<typeof applicationStatusPatchSchema>;

export const applicationSortOptions = ["updated", "created", "match"] as const;

// Dashboard inputs come from the URL; bad or tampered values fall back to defaults instead of failing.
export const applicationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(50),
  status: applicationStatusSchema.optional().catch(undefined),
  q: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => {
      const trimmed = value?.trim().slice(0, 100).trim();
      return trimmed ? trimmed : undefined;
    }),
  sort: z.enum(applicationSortOptions).catch("updated"),
  view: z.enum(["needs-action"]).optional().catch(undefined),
});

export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;

// Statuses that still need the user's attention before or during sending.
export const needsActionStatuses = ["DRAFT", "ANALYZED", "READY", "SENDING"] as const;

const followUpDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((value) => !Number.isNaN(value.getTime()), "Use a valid date.");

export const followUpPatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reschedule"), followUpAt: followUpDateSchema }).strict(),
  z.object({ action: z.literal("complete") }).strict(),
  z.object({ action: z.literal("clear") }).strict(),
]);

export type FollowUpPatch = z.infer<typeof followUpPatchSchema>;

// Follow-ups stop reminding once the job reaches an outcome.
export const followUpActiveStatuses = ["SENT", "FOLLOW_UP"] as const;

// Purpose: Zod schemas for application list queries and status updates.
// Constraints: schema definitions only; no persistence or HTTP handling.
import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "DRAFT",
  "ANALYZED",
  "READY",
  "SENT",
  "FOLLOW_UP",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "CLOSED",
]);

export const postSendStatuses = ["SENT", "FOLLOW_UP", "INTERVIEW", "REJECTED", "OFFER", "CLOSED"] as const;

export const userSettablePostSendStatuses = ["FOLLOW_UP", "INTERVIEW", "REJECTED", "OFFER", "CLOSED"] as const;

export const applicationStatusPatchSchema = z.object({
  status: z.enum(userSettablePostSendStatuses),
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationStatusPatch = z.infer<typeof applicationStatusPatchSchema>;

export const applicationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

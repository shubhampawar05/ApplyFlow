// Purpose: Zod schemas for Gmail OAuth and send request validation.
// Constraints: schema definitions only; no provider calls or persistence logic.
import { z } from "zod";

export const gmailSendRequestSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: "Explicit send confirmation is required." }),
  }),
});

export type GmailSendRequest = z.infer<typeof gmailSendRequestSchema>;

export const gmailOAuthStateSchema = z.object({
  userId: z.string().min(1),
  returnTo: z.string().min(1).max(500),
  expiresAt: z.number().int().positive(),
});

export type GmailOAuthState = z.infer<typeof gmailOAuthStateSchema>;

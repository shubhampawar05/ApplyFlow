// Purpose: Zod schemas for private media proxy route parameters.
// Constraints: schema definitions only; no storage or HTTP handling.
import { z } from "zod";

export const mediaTypeSchema = z.enum(["job-screenshot", "resume"]);

export type MediaType = z.infer<typeof mediaTypeSchema>;

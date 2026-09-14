import { describe, expect, it } from "vitest";
import { gmailSendRequestSchema } from "@/features/integrations/gmail/gmail.schemas";

describe("gmail send schema", () => {
  it("requires explicit confirm true", () => {
    expect(() => gmailSendRequestSchema.parse({ confirm: false })).toThrow();
    expect(gmailSendRequestSchema.parse({ confirm: true }).confirm).toBe(true);
    expect(gmailSendRequestSchema.parse({ confirm: true, acknowledgeDuplicate: true }).acknowledgeDuplicate).toBe(true);
  });
});

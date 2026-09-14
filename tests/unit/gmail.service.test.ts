import { afterEach, describe, expect, it } from "vitest";
import { createGmailOAuthState, parseGmailOAuthState } from "@/features/integrations/gmail/gmail-oauth-state";

describe("gmail oauth state", () => {
  afterEach(() => {
    delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  });

  it("creates and validates signed oauth state", () => {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "test-secret-key";
    const state = createGmailOAuthState("user-1", "/settings");
    const parsed = parseGmailOAuthState(state);

    expect(parsed.userId).toBe("user-1");
    expect(parsed.returnTo).toBe("/settings");
  });
});

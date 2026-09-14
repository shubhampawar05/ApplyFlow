import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto/token-encryption";

describe("token encryption", () => {
  afterEach(() => {
    delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  });

  it("round-trips encrypted secrets", () => {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "test-secret-key";
    const encrypted = encryptSecret("refresh-token-value");
    expect(decryptSecret(encrypted)).toBe("refresh-token-value");
  });
});

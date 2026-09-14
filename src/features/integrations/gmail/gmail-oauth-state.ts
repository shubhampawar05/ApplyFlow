// Purpose: sign and verify Gmail OAuth CSRF state payloads.
// Constraints: HMAC with OAUTH_TOKEN_ENCRYPTION_KEY; no database or Gmail API calls.
import { createHmac, timingSafeEqual } from "node:crypto";
import { gmailOAuthStateSchema } from "./gmail.schemas";

export class GmailOAuthStateError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GmailOAuthStateError";
    this.code = code;
  }
}

function getStateSecret() {
  const secret = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new GmailOAuthStateError("CONFIG_ERROR", "Gmail integration is not configured.");
  }
  return secret;
}

function signOAuthState(payload: string) {
  return createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}

export function createGmailOAuthState(userId: string, returnTo: string) {
  const state = gmailOAuthStateSchema.parse({
    userId,
    returnTo,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const encoded = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  const signature = signOAuthState(encoded);
  return `${encoded}.${signature}`;
}

export function parseGmailOAuthState(state: string) {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) {
    throw new GmailOAuthStateError("INVALID_OAUTH_STATE", "Gmail authorization state is invalid.");
  }

  const expected = signOAuthState(encoded);
  const provided = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");

  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
    throw new GmailOAuthStateError("INVALID_OAUTH_STATE", "Gmail authorization state is invalid.");
  }

  const parsed = gmailOAuthStateSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
  if (parsed.expiresAt < Date.now()) {
    throw new GmailOAuthStateError("EXPIRED_OAUTH_STATE", "Gmail authorization expired. Try connecting again.");
  }

  return parsed;
}

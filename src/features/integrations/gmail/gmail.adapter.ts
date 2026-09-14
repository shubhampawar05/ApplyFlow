// Purpose: call Google OAuth and Gmail API endpoints for token exchange and send.
// Constraints: no database access or auth checks; map provider errors to stable codes.
import { getGoogleClientId, getGoogleClientSecret, getGoogleRedirectUri } from "@/lib/google/env";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
};

type GmailSendResponse = {
  id: string;
  threadId?: string;
  labelIds?: string[];
};

export class GmailAdapterError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GmailAdapterError";
    this.code = code;
  }
}

function buildOAuthUrl(input: { state: string }) {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GMAIL_SEND_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: input.state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeAuthorizationCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new GmailAdapterError("GMAIL_OAUTH_FAILED", "Google could not complete Gmail authorization.");
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new GmailAdapterError("GMAIL_TOKEN_REFRESH_FAILED", "Gmail authorization expired. Reconnect Gmail in Settings.");
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new GmailAdapterError("GMAIL_OAUTH_FAILED", "Google could not verify the authorized Gmail account.");
  }

  return (await response.json()) as GoogleUserInfo;
}

function encodeMimeMessage(input: { to: string; subject: string; body: string }) {
  const mime = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.body,
  ].join("\r\n");

  return Buffer.from(mime, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendRawMessage(accessToken: string, rawMessage: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!response.ok) {
    throw new GmailAdapterError("GMAIL_SEND_FAILED", "Gmail rejected the send request. Review the draft and try again.");
  }

  return (await response.json()) as GmailSendResponse;
}

export const gmailAdapter = {
  buildOAuthUrl,
  exchangeAuthorizationCode,
  refreshAccessToken,
  fetchGoogleUserInfo,
  encodeMimeMessage,
  sendRawMessage,
};

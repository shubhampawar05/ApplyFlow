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

export type MimeAttachment = {
  fileName: string;
  mimeType: string;
  content: Uint8Array;
};

function sanitizeAttachmentFileName(fileName: string) {
  const cleaned = fileName.replace(/[\r\n"]/g, "").trim();
  return cleaned || "resume.pdf";
}

function toBase64Lines(content: Uint8Array) {
  const base64 = Buffer.from(content).toString("base64");
  return base64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function encodeRawMimeMessage(input: { to: string; subject: string; body: string; attachment?: MimeAttachment }) {
  if (!input.attachment) {
    return [
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      input.body,
    ].join("\r\n");
  }

  const boundary = `applyflow_${Date.now().toString(36)}`;
  const fileName = sanitizeAttachmentFileName(input.attachment.fileName);

  return [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.body,
    `--${boundary}`,
    `Content-Type: ${input.attachment.mimeType}; name="${fileName}"`,
    `Content-Disposition: attachment; filename="${fileName}"`,
    "Content-Transfer-Encoding: base64",
    "",
    toBase64Lines(input.attachment.content),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function encodeMimeMessage(input: { to: string; subject: string; body: string; attachment?: MimeAttachment }) {
  const mime = encodeRawMimeMessage(input);

  return Buffer.from(mime, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// A 4xx (except 429) proves Gmail did not send. Anything else after the request leaves may have sent.
function isDefiniteSendRejection(status: number) {
  return status >= 400 && status < 500 && status !== 429;
}

function sendOutcomeUnknownError() {
  return new GmailAdapterError(
    "GMAIL_SEND_UNKNOWN",
    "We could not confirm whether Gmail sent this email. Check your Gmail Sent folder.",
  );
}

async function sendRawMessage(accessToken: string, rawMessage: string) {
  let response: Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: rawMessage }),
    });
  } catch {
    throw sendOutcomeUnknownError();
  }

  if (!response.ok) {
    if (isDefiniteSendRejection(response.status)) {
      throw new GmailAdapterError(
        "GMAIL_SEND_REJECTED",
        "Gmail rejected the send request. Review the draft and try again.",
      );
    }

    throw sendOutcomeUnknownError();
  }

  try {
    const body = (await response.json()) as Partial<GmailSendResponse>;
    if (typeof body.id !== "string" || !body.id) {
      throw new Error("Missing message id");
    }

    return body as GmailSendResponse;
  } catch {
    throw sendOutcomeUnknownError();
  }
}

export const gmailAdapter = {
  buildOAuthUrl,
  exchangeAuthorizationCode,
  refreshAccessToken,
  fetchGoogleUserInfo,
  encodeMimeMessage,
  sendRawMessage,
};

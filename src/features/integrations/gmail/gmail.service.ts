// Purpose: orchestrate Gmail OAuth connection and approved message sending.
// Constraints: encrypted token storage; no autonomous send; explicit approval handled by application-send.service.
import { gmailAdapter, GmailAdapterError, type MimeAttachment } from "./gmail.adapter";
import { createGmailOAuthState, GmailOAuthStateError, parseGmailOAuthState } from "./gmail-oauth-state";
import {
  getGoogleConnectionForUser,
  hasGoogleConnectionForUser,
  updateGoogleAccessToken,
  upsertGoogleConnection,
} from "./gmail.repository";

export class GmailServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GmailServiceError";
    this.code = code;
  }
}

export function getGmailConnectUrl(userId: string, returnTo: string) {
  const state = createGmailOAuthState(userId, returnTo);
  return gmailAdapter.buildOAuthUrl({ state });
}

export async function completeGmailOAuthForUser(userId: string, code: string) {
  try {
    const tokenResponse = await gmailAdapter.exchangeAuthorizationCode(code);
    const userInfo = await gmailAdapter.fetchGoogleUserInfo(tokenResponse.access_token);

    if (!tokenResponse.refresh_token) {
      throw new GmailServiceError(
        "MISSING_REFRESH_TOKEN",
        "Google did not return a refresh token. Remove ApplyFlow Gmail access in Google Account settings and reconnect.",
      );
    }

    const expiresAt =
      typeof tokenResponse.expires_in === "number"
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : null;

    const connection = await upsertGoogleConnection({
      userId,
      providerAccountId: userInfo.email ?? userInfo.sub,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
    });

    return connection;
  } catch (error) {
    if (error instanceof GmailServiceError || error instanceof GmailAdapterError || error instanceof GmailOAuthStateError) {
      throw error instanceof GmailOAuthStateError
        ? new GmailServiceError(error.code, error.message)
        : error;
    }

    throw new GmailServiceError("GMAIL_OAUTH_FAILED", "Gmail connection failed. Try again in Settings.");
  }
}

async function getValidAccessToken(userId: string) {
  const connection = await getGoogleConnectionForUser(userId);
  if (!connection?.accessToken) {
    throw new GmailServiceError("MISSING_GMAIL_CONNECTION", "Connect Gmail in Settings before sending.");
  }

  const expiresSoon =
    connection.expiresAt && connection.expiresAt.getTime() <= Date.now() + 60 * 1000;

  if (!expiresSoon) {
    return connection.accessToken;
  }

  if (!connection.refreshToken) {
    throw new GmailServiceError("GMAIL_RECONNECT_REQUIRED", "Gmail authorization expired. Reconnect Gmail in Settings.");
  }

  const refreshed = await gmailAdapter.refreshAccessToken(connection.refreshToken);
  const expiresAt =
    typeof refreshed.expires_in === "number" ? new Date(Date.now() + refreshed.expires_in * 1000) : null;

  await updateGoogleAccessToken(connection.id, {
    accessToken: refreshed.access_token,
    expiresAt,
  });

  return refreshed.access_token;
}

export async function getGmailConnectionStatus(userId: string) {
  const connected = await hasGoogleConnectionForUser(userId);
  if (!connected) {
    return { connected: false as const };
  }

  const connection = await getGoogleConnectionForUser(userId);
  return {
    connected: true as const,
    accountEmail: connection?.providerAccountId ?? null,
    updatedAt: connection?.updatedAt ?? null,
  };
}

export async function sendGmailMessageForUser(
  userId: string,
  input: { to: string; subject: string; body: string; attachment?: MimeAttachment },
) {
  const accessToken = await getValidAccessToken(userId);
  const rawMessage = gmailAdapter.encodeMimeMessage(input);

  try {
    const response = await gmailAdapter.sendRawMessage(accessToken, rawMessage);
    return { providerMessageId: response.id };
  } catch (error) {
    if (error instanceof GmailAdapterError) {
      throw new GmailServiceError(error.code, error.message);
    }

    throw new GmailServiceError("GMAIL_SEND_FAILED", "Gmail could not send this email right now.");
  }
}

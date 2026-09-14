export function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID.");
  }
  return clientId;
}

export function getGoogleClientSecret() {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET.");
  }
  return clientSecret;
}

export function getGoogleRedirectUri() {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("Missing GOOGLE_REDIRECT_URI.");
  }
  return redirectUri;
}

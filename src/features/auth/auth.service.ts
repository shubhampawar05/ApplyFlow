// Purpose: pure auth identity helpers and Supabase claim parsing.
// Constraints: no database, HTTP, or redirect logic; no secrets in logs.
export type AuthIdentity = {
  authUserId: string;
  email: string;
  displayName: string | null;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function displayNameFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const name = record.full_name ?? record.name;
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function identityFromClaims(claims: {
  sub?: unknown;
  email?: unknown;
  user_metadata?: unknown;
}): AuthIdentity | null {
  if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;
  if (typeof claims.email !== "string") return null;
  const email = normalizeEmail(claims.email);
  if (!email) return null;
  return {
    authUserId: claims.sub,
    email,
    displayName: displayNameFromMetadata(claims.user_metadata),
  };
}

export function toUserUpsertArgs(identity: AuthIdentity) {
  const email = normalizeEmail(identity.email);
  if (!email) {
    throw new Error("AUTH_EMAIL_REQUIRED");
  }

  return {
    where: { authUserId: identity.authUserId },
    update: { email, displayName: identity.displayName },
    create: {
      authUserId: identity.authUserId,
      email,
      displayName: identity.displayName,
    },
  };
}

// Purpose: persist encrypted Gmail OAuth connections for authenticated users.
// Constraints: Prisma access only; encrypt tokens before write; no Gmail API calls.
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto/token-encryption";

export async function getGoogleConnectionForUser(userId: string) {
  const connection = await prisma.oAuthConnection.findUnique({
    where: { userId_provider: { userId, provider: "GOOGLE" } },
  });

  if (!connection) {
    return null;
  }

  return {
    ...connection,
    accessToken: connection.encryptedAccessToken ? decryptSecret(connection.encryptedAccessToken) : null,
    refreshToken: connection.encryptedRefreshToken ? decryptSecret(connection.encryptedRefreshToken) : null,
  };
}

export async function upsertGoogleConnection(input: {
  userId: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}) {
  return prisma.oAuthConnection.upsert({
    where: { userId_provider: { userId: input.userId, provider: "GOOGLE" } },
    update: {
      providerAccountId: input.providerAccountId,
      encryptedAccessToken: encryptSecret(input.accessToken),
      encryptedRefreshToken: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      expiresAt: input.expiresAt,
    },
    create: {
      userId: input.userId,
      provider: "GOOGLE",
      providerAccountId: input.providerAccountId,
      encryptedAccessToken: encryptSecret(input.accessToken),
      encryptedRefreshToken: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      expiresAt: input.expiresAt,
    },
    select: {
      id: true,
      providerAccountId: true,
      expiresAt: true,
      updatedAt: true,
    },
  });
}

export async function updateGoogleAccessToken(
  connectionId: string,
  input: { accessToken: string; expiresAt: Date | null },
) {
  return prisma.oAuthConnection.update({
    where: { id: connectionId },
    data: {
      encryptedAccessToken: encryptSecret(input.accessToken),
      expiresAt: input.expiresAt,
    },
  });
}

export async function hasGoogleConnectionForUser(userId: string) {
  const connection = await prisma.oAuthConnection.findUnique({
    where: { userId_provider: { userId, provider: "GOOGLE" } },
    select: { id: true },
  });

  return Boolean(connection);
}

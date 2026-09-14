// Purpose: sync authenticated identity to the application user record.
// Constraints: Prisma upsert only; no HTTP, redirect, or claim parsing logic.
import { prisma } from "@/lib/prisma";
import { toUserUpsertArgs, type AuthIdentity } from "./auth.service";

export async function syncAppUser(identity: AuthIdentity) {
  return prisma.user.upsert(toUserUpsertArgs(identity));
}

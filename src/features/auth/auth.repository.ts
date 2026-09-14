import { prisma } from "@/lib/prisma";
import { toUserUpsertArgs, type AuthIdentity } from "./auth.service";

export async function syncAppUser(identity: AuthIdentity) {
  return prisma.user.upsert(toUserUpsertArgs(identity));
}

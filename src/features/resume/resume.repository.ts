import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { ResumeProfilePatch } from "@/features/ai/resume-parsing.schema";
import type { PreparedResumeUpload } from "./resume.types";

export async function getResumeOwnedByUser(userId: string, resumeId: string) {
  return prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: { profile: true },
  });
}

export async function getDefaultResumeWithProfile(userId: string) {
  const defaultResume = await prisma.resume.findFirst({
    where: { userId, isDefault: true },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });

  if (defaultResume) return defaultResume;

  return prisma.resume.findFirst({
    where: { userId },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertResumeProfile(
  resumeId: string,
  data: {
    fullName: string | null;
    headline: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    content: Prisma.InputJsonValue;
  },
) {
  return prisma.resumeProfile.upsert({
    where: { resumeId },
    update: data,
    create: { resumeId, ...data },
  });
}

export async function updateResumeProfile(resumeId: string, patch: ResumeProfilePatch) {
  const existing = await prisma.resumeProfile.findUnique({ where: { resumeId } });
  if (!existing) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const nextContent = patch.content
    ? { ...(existing.content as Record<string, unknown>), ...patch.content }
    : existing.content;

  return prisma.resumeProfile.update({
    where: { resumeId },
    data: {
      fullName: patch.fullName ?? existing.fullName,
      headline: patch.headline ?? existing.headline,
      email: patch.email ?? existing.email,
      phone: patch.phone ?? existing.phone,
      location: patch.location ?? existing.location,
      content: nextContent as Prisma.InputJsonValue,
    },
  });
}

export async function listResumesForUser(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      byteSize: true,
      isDefault: true,
      createdAt: true,
    },
  });
}

export async function createResumeAsDefault(upload: PreparedResumeUpload) {
  return prisma.$transaction(async (tx) => {
    await tx.resume.updateMany({
      where: { userId: upload.userId, isDefault: true },
      data: { isDefault: false },
    });

    return tx.resume.create({
      data: {
        userId: upload.userId,
        fileName: upload.fileName,
        storageKey: upload.storageKey,
        mimeType: upload.mimeType,
        byteSize: upload.byteSize,
        isDefault: true,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        byteSize: true,
        isDefault: true,
        createdAt: true,
      },
    });
  });
}

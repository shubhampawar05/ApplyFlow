import { prisma } from "@/lib/prisma";
import type { PreparedResumeUpload } from "./resume.types";

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

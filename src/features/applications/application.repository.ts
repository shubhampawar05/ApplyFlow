import { prisma } from "@/lib/prisma";

export async function getApplicationForUser(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
    },
  });
}

export async function createDraftApplicationForJob(userId: string, jobId: string) {
  const defaultResume = await prisma.resume.findFirst({
    where: { userId, isDefault: true },
    select: { id: true },
  });

  return prisma.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        userId,
        jobId,
        resumeId: defaultResume?.id ?? null,
        status: "DRAFT",
      },
      select: {
        id: true,
        status: true,
        jobId: true,
        resumeId: true,
        createdAt: true,
      },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: "APPLICATION_CREATED",
        toStatus: "DRAFT",
      },
    });

    return application;
  });
}

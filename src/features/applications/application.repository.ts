import type { Prisma } from "@prisma/client";
import type { ResumeMatchingOutput } from "@/features/ai/resume-matching.schema";
import { prisma } from "@/lib/prisma";

export async function getApplicationForUser(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
    },
  });
}

export async function getApplicationDetailForUser(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
      resume: {
        include: {
          profile: true,
        },
      },
      events: {
        where: { type: "MATCH_COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getApplicationMatchContext(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
      resume: {
        include: {
          profile: true,
        },
      },
    },
  });
}

export async function saveApplicationMatchResult(
  applicationId: string,
  input: {
    resumeId: string;
    matchScore: number;
    matchDetails: ResumeMatchingOutput;
  },
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        resumeId: input.resumeId,
        matchScore: input.matchScore,
      },
      select: {
        id: true,
        status: true,
        jobId: true,
        resumeId: true,
        matchScore: true,
        updatedAt: true,
      },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId,
        type: "MATCH_COMPLETED",
        metadata: input.matchDetails as Prisma.InputJsonValue,
      },
    });

    return updated;
  });
}

export async function markApplicationAnalyzedForJob(userId: string, jobId: string) {
  const application = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  if (!application) {
    return null;
  }

  if (application.status === "ANALYZED") {
    return application;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: application.id },
      data: { status: "ANALYZED" },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: "STATUS_CHANGED",
        fromStatus: application.status,
        toStatus: "ANALYZED",
      },
    });

    return updated;
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

// Purpose: Prisma persistence for applications, match results, and generated emails.
// Constraints: user-scoped queries only; no provider SDK calls or HTTP handling.
import type { Prisma } from "@prisma/client";
import type { EmailPatch } from "@/features/ai/email-generation.schema";
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
      emails: {
        orderBy: [{ isSelected: "desc" }, { createdAt: "desc" }],
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

export async function getApplicationEmailContext(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
      resume: {
        include: {
          profile: true,
        },
      },
      emails: {
        orderBy: [{ isSelected: "desc" }, { createdAt: "desc" }],
      },
      events: {
        where: { type: "MATCH_COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
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

export async function createSelectedGeneratedEmail(input: {
  applicationId: string;
  resumeId: string;
  to: string;
  subject: string;
  body: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.generatedEmail.updateMany({
      where: { applicationId: input.applicationId, isSelected: true },
      data: { isSelected: false },
    });

    const generatedEmail = await tx.generatedEmail.create({
      data: {
        applicationId: input.applicationId,
        to: input.to,
        subject: input.subject,
        body: input.body,
        isSelected: true,
      },
    });

    const application = await tx.application.update({
      where: { id: input.applicationId },
      data: {
        resumeId: input.resumeId,
        status: "READY",
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
        applicationId: input.applicationId,
        type: "EMAIL_GENERATED",
        toStatus: "READY",
      },
    });

    return { application, generatedEmail };
  });
}

export async function updateSelectedGeneratedEmail(
  applicationId: string,
  emailId: string,
  patch: EmailPatch,
) {
  const existing = await prisma.generatedEmail.findFirst({
    where: { id: emailId, applicationId },
  });

  if (!existing) {
    throw new Error("EMAIL_NOT_FOUND");
  }

  return prisma.generatedEmail.update({
    where: { id: emailId },
    data: {
      subject: patch.subject ?? existing.subject,
      body: patch.body ?? existing.body,
      isSelected: true,
    },
  });
}

export async function markApplicationReady(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true },
  });

  if (!application) {
    throw new Error("APPLICATION_NOT_FOUND");
  }

  if (application.status === "READY") {
    return prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        jobId: true,
        resumeId: true,
        matchScore: true,
        updatedAt: true,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: { status: "READY" },
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
        type: "STATUS_CHANGED",
        fromStatus: application.status,
        toStatus: "READY",
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

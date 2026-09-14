// Purpose: Prisma persistence for applications, match results, and generated emails.
// Constraints: user-scoped queries only; no provider SDK calls or HTTP handling.
import type { ApplicationStatus, Prisma } from "@prisma/client";
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
        orderBy: { createdAt: "desc" },
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

export async function getApplicationSendContext(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
      resume: {
        select: {
          id: true,
          fileName: true,
          storageKey: true,
          mimeType: true,
        },
      },
      emails: {
        orderBy: [{ isSelected: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export async function recordSuccessfulEmailDelivery(input: {
  applicationId: string;
  generatedEmailId: string;
  recipient: string;
  providerMessageId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: input.applicationId },
      select: { id: true, status: true },
    });

    if (!application) {
      throw new Error("APPLICATION_NOT_FOUND");
    }

    const delivery = await tx.emailDelivery.create({
      data: {
        applicationId: input.applicationId,
        generatedEmailId: input.generatedEmailId,
        recipient: input.recipient,
        providerMessageId: input.providerMessageId,
        sentAt: new Date(),
      },
    });

    const updatedApplication = await tx.application.update({
      where: { id: input.applicationId },
      data: { status: "SENT" },
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
        type: "EMAIL_SENT",
        fromStatus: application.status,
        toStatus: "SENT",
        metadata: {
          providerMessageId: input.providerMessageId,
          generatedEmailId: input.generatedEmailId,
        },
      },
    });

    return { application: updatedApplication, delivery };
  });
}

export async function listApplicationsForDuplicateCheck(userId: string, applicationId: string) {
  const current = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: {
      id: true,
      job: {
        select: {
          company: true,
          title: true,
          applicationEmail: true,
          normalizedCompany: true,
          normalizedTitle: true,
          normalizedApplicationEmail: true,
        },
      },
    },
  });

  if (!current) {
    return { current: null, others: [] };
  }

  const others = await prisma.application.findMany({
    where: {
      userId,
      id: { not: applicationId },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: {
      id: true,
      status: true,
      updatedAt: true,
      job: {
        select: {
          company: true,
          title: true,
          applicationEmail: true,
          normalizedCompany: true,
          normalizedTitle: true,
          normalizedApplicationEmail: true,
        },
      },
    },
  });

  return { current, others };
}

export async function getApplicationStatsForUser(userId: string) {
  const grouped = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Record<string, number>;
  const read = (status: ApplicationStatus) => counts[status] ?? 0;

  const draft = read("DRAFT");
  const analyzed = read("ANALYZED");
  const ready = read("READY");
  const sent = read("SENT");
  const followUp = read("FOLLOW_UP");
  const interview = read("INTERVIEW");
  const rejected = read("REJECTED");
  const offer = read("OFFER");
  const closed = read("CLOSED");

  return {
    draft,
    analyzed,
    ready,
    sent,
    followUp,
    interview,
    rejected,
    offer,
    closed,
    total: draft + analyzed + ready + sent + followUp + interview + rejected + offer + closed,
  };
}

export async function listApplicationsForUser(
  userId: string,
  options: { limit?: number; status?: ApplicationStatus } = {},
) {
  const limit = options.limit ?? 20;

  return prisma.application.findMany({
    where: {
      userId,
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      matchScore: true,
      createdAt: true,
      updatedAt: true,
      job: {
        select: {
          company: true,
          title: true,
          applicationEmail: true,
        },
      },
    },
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  input: { fromStatus: ApplicationStatus; toStatus: ApplicationStatus },
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: { status: input.toStatus },
      include: {
        job: true,
      },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId,
        type: "STATUS_CHANGED",
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
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

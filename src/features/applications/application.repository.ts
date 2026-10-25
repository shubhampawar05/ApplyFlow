// Purpose: Prisma persistence for applications, match results, and generated emails.
// Constraints: user-scoped queries only; no provider SDK calls or HTTP handling.
import type { ApplicationStatus, Prisma } from "@/generated/prisma";
import type { EmailPatch } from "@/features/ai/email-generation.schema";
import type { ResumeMatchingOutput } from "@/features/ai/resume-matching.schema";
import { prisma } from "@/lib/prisma";

// Statuses an application can be moved between by editing; sending and later are never undone by edits.
const preSendStatuses = new Set<ApplicationStatus>(["DRAFT", "ANALYZED", "READY"]);

export const FOLLOW_UP_DEFAULT_DAYS = 7;

export function defaultFollowUpAt(from: Date) {
  return new Date(from.getTime() + FOLLOW_UP_DEFAULT_DAYS * 24 * 60 * 60 * 1000);
}

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

export async function recordJobReviewSavedForJob(userId: string, jobId: string) {
  const application = await prisma.application.findFirst({
    where: { userId, jobId },
    select: { id: true },
  });

  if (!application) {
    return null;
  }

  const existing = await prisma.applicationEvent.findFirst({
    where: { applicationId: application.id, type: "JOB_REVIEW_SAVED" },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.applicationEvent.create({
    data: {
      applicationId: application.id,
      type: "JOB_REVIEW_SAVED",
    },
  });
}

export async function recordMatchSkipped(applicationId: string) {
  return prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "MATCH_SKIPPED",
    },
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

  if (application.status === "READY" || !preSendStatuses.has(application.status)) {
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

  if (application.status === "ANALYZED" || !preSendStatuses.has(application.status)) {
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

export type SendClaimResult =
  | { claimed: true }
  | { claimed: false; status: ApplicationStatus | null; sendOutcomeUnknown: boolean; sendStartedAt: Date | null };

export async function claimApplicationForSend(
  userId: string,
  applicationId: string,
  now: Date = new Date(),
): Promise<SendClaimResult> {
  const result = await prisma.application.updateMany({
    where: { id: applicationId, userId, status: "READY" },
    data: { status: "SENDING", sendStartedAt: now, sendOutcomeUnknown: false },
  });

  if (result.count === 1) {
    return { claimed: true };
  }

  const current = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { status: true, sendOutcomeUnknown: true, sendStartedAt: true },
  });

  return {
    claimed: false,
    status: current?.status ?? null,
    sendOutcomeUnknown: current?.sendOutcomeUnknown ?? false,
    sendStartedAt: current?.sendStartedAt ?? null,
  };
}

export async function releaseSendClaim(applicationId: string) {
  return prisma.application.updateMany({
    where: { id: applicationId, status: "SENDING" },
    data: { status: "READY", sendStartedAt: null, sendOutcomeUnknown: false },
  });
}

export async function markSendOutcomeUnknown(applicationId: string) {
  return prisma.application.updateMany({
    where: { id: applicationId, status: "SENDING" },
    data: { sendOutcomeUnknown: true },
  });
}

export async function recordSuccessfulEmailDelivery(input: {
  applicationId: string;
  generatedEmailId: string;
  recipient: string;
  providerMessageId: string;
  sentAt?: Date;
}) {
  const sentAt = input.sentAt ?? new Date();

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.emailDelivery.create({
      data: {
        applicationId: input.applicationId,
        generatedEmailId: input.generatedEmailId,
        recipient: input.recipient,
        providerMessageId: input.providerMessageId,
        sentAt,
      },
    });

    const claimed = await tx.application.updateMany({
      where: { id: input.applicationId, status: "SENDING" },
      data: {
        status: "SENT",
        sendStartedAt: null,
        sendOutcomeUnknown: false,
        followUpAt: defaultFollowUpAt(sentAt),
        followUpCompletedAt: null,
      },
    });

    if (claimed.count !== 1) {
      throw new Error("SEND_CLAIM_LOST");
    }

    const updatedApplication = await tx.application.findUniqueOrThrow({
      where: { id: input.applicationId },
      select: {
        id: true,
        status: true,
        jobId: true,
        resumeId: true,
        matchScore: true,
        followUpAt: true,
        updatedAt: true,
      },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId: input.applicationId,
        type: "EMAIL_SENT",
        fromStatus: "SENDING",
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

export async function resolveUnknownSendOutcome(
  applicationId: string,
  input: { sent: boolean; now?: Date },
) {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const resolved = await tx.application.updateMany({
      where: { id: applicationId, status: "SENDING" },
      data: input.sent
        ? {
            status: "SENT",
            sendStartedAt: null,
            sendOutcomeUnknown: false,
            followUpAt: defaultFollowUpAt(now),
            followUpCompletedAt: null,
          }
        : { status: "READY", sendStartedAt: null, sendOutcomeUnknown: false },
    });

    if (resolved.count !== 1) {
      return null;
    }

    await tx.applicationEvent.create({
      data: {
        applicationId,
        type: input.sent ? "SEND_CONFIRMED_MANUALLY" : "SEND_MARKED_NOT_SENT",
        fromStatus: "SENDING",
        toStatus: input.sent ? "SENT" : "READY",
        metadata: { manual: true },
      },
    });

    return tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      select: { id: true, status: true, followUpAt: true, updatedAt: true },
    });
  });
}

export async function updateApplicationFollowUp(
  applicationId: string,
  input: {
    data: { followUpAt?: Date | null; followUpCompletedAt?: Date | null };
    eventType: "FOLLOW_UP_RESCHEDULED" | "FOLLOW_UP_COMPLETED" | "FOLLOW_UP_CLEARED";
    metadata?: Prisma.InputJsonValue;
  },
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: input.data,
      select: { id: true, status: true, followUpAt: true, followUpCompletedAt: true, updatedAt: true },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId,
        type: input.eventType,
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });

    return updated;
  });
}

export async function listDueFollowUpsForUser(userId: string, now: Date = new Date()) {
  return prisma.application.findMany({
    where: {
      userId,
      status: { in: ["SENT", "FOLLOW_UP"] },
      followUpAt: { lte: now },
      followUpCompletedAt: null,
    },
    orderBy: { followUpAt: "asc" },
    take: 20,
    select: {
      id: true,
      status: true,
      followUpAt: true,
      job: { select: { company: true, title: true } },
    },
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
  const sending = read("SENDING");
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
    sending,
    sent,
    followUp,
    interview,
    rejected,
    offer,
    closed,
    total: draft + analyzed + ready + sending + sent + followUp + interview + rejected + offer + closed,
  };
}

export async function listApplicationsForUser(
  userId: string,
  options: {
    limit?: number;
    status?: ApplicationStatus;
    q?: string;
    sort?: "updated" | "created" | "match";
    needsAction?: boolean;
    now?: Date;
  } = {},
) {
  const limit = options.limit ?? 50;
  const now = options.now ?? new Date();
  const and: Prisma.ApplicationWhereInput[] = [];

  if (options.status) {
    and.push({ status: options.status });
  }

  if (options.q) {
    and.push({
      job: {
        OR: [
          { company: { contains: options.q, mode: "insensitive" } },
          { title: { contains: options.q, mode: "insensitive" } },
        ],
      },
    });
  }

  if (options.needsAction) {
    and.push({
      OR: [
        { status: { in: ["DRAFT", "ANALYZED", "READY", "SENDING"] } },
        {
          status: { in: ["SENT", "FOLLOW_UP"] },
          followUpAt: { lte: now },
          followUpCompletedAt: null,
        },
      ],
    });
  }

  const orderBy: Prisma.ApplicationOrderByWithRelationInput[] =
    options.sort === "created"
      ? [{ createdAt: "desc" }]
      : options.sort === "match"
        ? [{ matchScore: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }]
        : [{ updatedAt: "desc" }];

  return prisma.application.findMany({
    where: { userId, ...(and.length > 0 ? { AND: and } : {}) },
    orderBy,
    take: limit,
    select: {
      id: true,
      status: true,
      matchScore: true,
      sendOutcomeUnknown: true,
      sendStartedAt: true,
      followUpAt: true,
      followUpCompletedAt: true,
      createdAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          company: true,
          title: true,
          applicationEmail: true,
          screenshotStorageKey: true,
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

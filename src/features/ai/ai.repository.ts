// Purpose: persist AI request lifecycle records for auditing and idempotency.
// Constraints: Prisma access only; no provider SDK calls or prompt logic.
import { AIRequestKind, AIRequestStatus, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function createAiRequest(input: {
  userId: string;
  kind: AIRequestKind;
  promptVersion: string;
  inputHash: string;
}) {
  return prisma.aIRequest.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      promptVersion: input.promptVersion,
      inputHash: input.inputHash,
      status: AIRequestStatus.PENDING,
    },
  });
}

export async function completeAiRequest(
  id: string,
  result: { status: AIRequestStatus; output?: Prisma.InputJsonValue; errorCode?: string },
) {
  return prisma.aIRequest.update({
    where: { id },
    data: {
      status: result.status,
      output: result.output,
      errorCode: result.errorCode,
      completedAt: new Date(),
    },
  });
}

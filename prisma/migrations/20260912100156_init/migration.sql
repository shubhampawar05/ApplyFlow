-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('DRAFT', 'ANALYZED', 'READY', 'SENT', 'FOLLOW_UP', 'INTERVIEW', 'REJECTED', 'OFFER', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."JobSourceType" AS ENUM ('SCREENSHOT', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."OAuthProvider" AS ENUM ('GOOGLE');

-- CreateEnum
CREATE TYPE "public"."AIRequestKind" AS ENUM ('JOB_EXTRACTION', 'RESUME_PARSING', 'RESUME_MATCHING', 'EMAIL_GENERATION', 'EMAIL_VALIDATION');

-- CreateEnum
CREATE TYPE "public"."AIRequestStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResumeProfile" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "fullName" TEXT,
    "headline" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "public"."JobSourceType" NOT NULL DEFAULT 'SCREENSHOT',
    "screenshotStorageKey" TEXT,
    "company" TEXT,
    "normalizedCompany" TEXT,
    "title" TEXT,
    "normalizedTitle" TEXT,
    "location" TEXT,
    "employmentType" TEXT,
    "experience" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "salary" TEXT,
    "applicationEmail" TEXT,
    "normalizedApplicationEmail" TEXT,
    "applicationUrl" TEXT,
    "source" TEXT,
    "deadline" TIMESTAMP(3),
    "extractionConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeId" TEXT,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "matchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedEmail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailDelivery" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "generatedEmailId" TEXT,
    "providerMessageId" TEXT,
    "recipient" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" "public"."ApplicationStatus",
    "toStatus" "public"."ApplicationStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OAuthConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."OAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "public"."AIRequestKind" NOT NULL,
    "status" "public"."AIRequestStatus" NOT NULL DEFAULT 'PENDING',
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "output" JSONB,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_storageKey_key" ON "public"."Resume"("storageKey");

-- CreateIndex
CREATE INDEX "Resume_userId_createdAt_idx" ON "public"."Resume"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Resume_userId_isDefault_idx" ON "public"."Resume"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeProfile_resumeId_key" ON "public"."ResumeProfile"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_screenshotStorageKey_key" ON "public"."Job"("screenshotStorageKey");

-- CreateIndex
CREATE INDEX "Job_userId_createdAt_idx" ON "public"."Job"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_userId_normalizedCompany_normalizedTitle_idx" ON "public"."Job"("userId", "normalizedCompany", "normalizedTitle");

-- CreateIndex
CREATE INDEX "Job_userId_normalizedApplicationEmail_idx" ON "public"."Job"("userId", "normalizedApplicationEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_key" ON "public"."Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_userId_status_updatedAt_idx" ON "public"."Application"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Application_userId_createdAt_idx" ON "public"."Application"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedEmail_applicationId_createdAt_idx" ON "public"."GeneratedEmail"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_providerMessageId_key" ON "public"."EmailDelivery"("providerMessageId");

-- CreateIndex
CREATE INDEX "EmailDelivery_applicationId_createdAt_idx" ON "public"."EmailDelivery"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "public"."ApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthConnection_userId_provider_key" ON "public"."OAuthConnection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthConnection_provider_providerAccountId_key" ON "public"."OAuthConnection"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "AIRequest_userId_kind_createdAt_idx" ON "public"."AIRequest"("userId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "AIRequest_status_createdAt_idx" ON "public"."AIRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResumeProfile" ADD CONSTRAINT "ResumeProfile_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedEmail" ADD CONSTRAINT "GeneratedEmail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailDelivery" ADD CONSTRAINT "EmailDelivery_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OAuthConnection" ADD CONSTRAINT "OAuthConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIRequest" ADD CONSTRAINT "AIRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

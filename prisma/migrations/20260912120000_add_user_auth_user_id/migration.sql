-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "authUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "public"."User"("authUserId");

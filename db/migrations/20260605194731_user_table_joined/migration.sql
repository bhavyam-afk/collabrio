/*
  Warnings:

  - You are about to drop the column `username` on the `BrandProfile` table. All the data in the column will be lost.
  - You are about to drop the column `walletId` on the `BrandProfile` table. All the data in the column will be lost.
  - You are about to drop the column `collabstatus` on the `Collaboration` table. All the data in the column will be lost.
  - You are about to drop the column `follower_count` on the `CreatorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `CreatorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `walletId` on the `CreatorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `packagestatus` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `draftapprovalAt` on the `PackageCollaboration` table. All the data in the column will be lost.
  - The `contentStatus` column on the `PackageCollaboration` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'IMPROVEMENT_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COLLAB_INVITE', 'DRAFT_SUBMITTED', 'DRAFT_APPROVED', 'IMPROVEMENT_REQUESTED', 'PAYMENT_RECEIVED', 'PAYOUT_PROCESSED');

-- DropForeignKey
ALTER TABLE "BrandProfile" DROP CONSTRAINT "BrandProfile_walletId_fkey";

-- DropForeignKey
ALTER TABLE "CreatorProfile" DROP CONSTRAINT "CreatorProfile_walletId_fkey";

-- DropIndex
DROP INDEX "BrandProfile_id_username_key";

-- DropIndex
DROP INDEX "BrandProfile_username_key";

-- DropIndex
DROP INDEX "BrandProfile_walletId_key";

-- DropIndex
DROP INDEX "CreatorProfile_id_username_key";

-- DropIndex
DROP INDEX "CreatorProfile_username_key";

-- DropIndex
DROP INDEX "CreatorProfile_walletId_key";

-- AlterTable
ALTER TABLE "BrandProfile" DROP COLUMN "username",
DROP COLUMN "walletId";

-- AlterTable
ALTER TABLE "Collaboration" DROP COLUMN "collabstatus",
ADD COLUMN     "collabStatus" "CollabStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "CreatorProfile" DROP COLUMN "follower_count",
DROP COLUMN "username",
DROP COLUMN "walletId",
ADD COLUMN     "followerCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "packagestatus",
ADD COLUMN     "packageStatus" "PackageStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "PackageCollaboration" DROP COLUMN "draftapprovalAt",
ADD COLUMN     "draftApprovedAt" TIMESTAMP(3),
ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "contentStatus",
ADD COLUMN     "contentStatus" "ContentStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboarding" "OnboardingStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "contentStatus";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "collabId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Transaction_externalPaymentId_idx" ON "Transaction"("externalPaymentId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

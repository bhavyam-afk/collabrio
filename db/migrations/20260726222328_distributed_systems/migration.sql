-- CreateEnum
CREATE TYPE "SagaType" AS ENUM ('APPROVE_COLLABORATION', 'CANCEL_COLLABORATION', 'PAYOUT');

-- CreateEnum
CREATE TYPE "SagaStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'COMPENSATED');

-- CreateEnum
CREATE TYPE "AnalyticsJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "SagaLog" (
    "id" TEXT NOT NULL,
    "collabId" TEXT NOT NULL,
    "sagaType" "SagaType" NOT NULL,
    "step" TEXT NOT NULL,
    "status" "SagaStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SagaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsJob" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "igAccountId" TEXT NOT NULL,
    "status" "AnalyticsJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SagaLog_collabId_idx" ON "SagaLog"("collabId");

-- CreateIndex
CREATE INDEX "SagaLog_status_idx" ON "SagaLog"("status");

-- CreateIndex
CREATE INDEX "AnalyticsJob_status_idx" ON "AnalyticsJob"("status");

-- CreateIndex
CREATE INDEX "AnalyticsJob_creatorId_idx" ON "AnalyticsJob"("creatorId");

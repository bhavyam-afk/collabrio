-- CreateTable
CREATE TABLE "creatorFullAnalytics" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "engagements" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "replies" INTEGER NOT NULL,
    "profileViews" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creatorFullAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creatorFullAnalytics_creatorId_key" ON "creatorFullAnalytics"("creatorId");

-- AddForeignKey
ALTER TABLE "creatorFullAnalytics" ADD CONSTRAINT "creatorFullAnalytics_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

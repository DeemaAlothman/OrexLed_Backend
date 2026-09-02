-- CreateEnum
CREATE TYPE "VideoCreditTransactionType" AS ENUM ('INITIAL_GRANT', 'ADMIN_TOPUP', 'GENERATION_SPEND', 'GENERATION_REFUND');

-- CreateTable
CREATE TABLE "video_credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VideoCreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "videoGenerationId" TEXT,
    "performedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_credit_transactions_userId_idx" ON "video_credit_transactions"("userId");

-- AddForeignKey
ALTER TABLE "video_credit_transactions" ADD CONSTRAINT "video_credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_credit_transactions" ADD CONSTRAINT "video_credit_transactions_videoGenerationId_fkey" FOREIGN KEY ("videoGenerationId") REFERENCES "video_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_credit_transactions" ADD CONSTRAINT "video_credit_transactions_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

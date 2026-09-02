-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "MaintenanceRequestStatus" AS ENUM ('NEW', 'SCHEDULED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepresentativeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" "MaintenanceRequestStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "quote_requests" ADD COLUMN     "note" TEXT,
ADD COLUMN     "quotedPrice" DOUBLE PRECISION,
ADD COLUMN     "status" "QuoteRequestStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "representatives" ADD COLUMN     "status" "RepresentativeStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "representativeId" TEXT NOT NULL,
    "dealValue" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commissions_quoteRequestId_key" ON "commissions"("quoteRequestId");

-- CreateIndex
CREATE INDEX "commissions_representativeId_idx" ON "commissions"("representativeId");

-- CreateIndex
CREATE INDEX "commissions_paid_idx" ON "commissions"("paid");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "quote_requests_status_idx" ON "quote_requests"("status");

-- CreateIndex
CREATE INDEX "representatives_status_idx" ON "representatives"("status");

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "quote_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

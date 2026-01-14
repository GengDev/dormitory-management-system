-- AlterEnum
ALTER TYPE "BillStatus" ADD VALUE 'verifying';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'payment_submitted';

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "utilityId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "receiptUrl" TEXT;

-- CreateTable
CREATE TABLE "room_utilities" (
    "id" TEXT NOT NULL,
    "recordMonth" TIMESTAMP(3) NOT NULL,
    "waterPreviousReading" DOUBLE PRECISION,
    "waterCurrentReading" DOUBLE PRECISION,
    "waterUsage" DOUBLE PRECISION,
    "waterRate" DOUBLE PRECISION NOT NULL,
    "waterCost" DOUBLE PRECISION NOT NULL,
    "electricityPreviousReading" DOUBLE PRECISION,
    "electricityCurrentReading" DOUBLE PRECISION,
    "electricityUsage" DOUBLE PRECISION,
    "electricityRate" DOUBLE PRECISION NOT NULL,
    "electricityCost" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "tenantId" TEXT,
    "recordedById" TEXT,

    CONSTRAINT "room_utilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_utilities_roomId_idx" ON "room_utilities"("roomId");

-- CreateIndex
CREATE INDEX "room_utilities_tenantId_idx" ON "room_utilities"("tenantId");

-- CreateIndex
CREATE INDEX "room_utilities_recordMonth_idx" ON "room_utilities"("recordMonth");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_utilityId_fkey" FOREIGN KEY ("utilityId") REFERENCES "room_utilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_utilities" ADD CONSTRAINT "room_utilities_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_utilities" ADD CONSTRAINT "room_utilities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_utilities" ADD CONSTRAINT "room_utilities_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

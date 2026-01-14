-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed', 'read');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

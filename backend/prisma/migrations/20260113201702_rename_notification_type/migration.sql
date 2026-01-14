/*
  Warnings:

  - You are about to drop the column `type` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `notificationType` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "notifications_type_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "type",
ADD COLUMN     "notificationType" "NotificationType" NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_notificationType_idx" ON "notifications"("notificationType");

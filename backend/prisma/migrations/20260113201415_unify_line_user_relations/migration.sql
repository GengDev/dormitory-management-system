/*
  Warnings:

  - You are about to drop the column `tenantId` on the `line_users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `line_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lineUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "line_users" DROP CONSTRAINT "line_users_tenantId_fkey";

-- DropIndex
DROP INDEX "line_users_tenantId_key";

-- AlterTable
ALTER TABLE "line_users" DROP COLUMN "tenantId",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lineUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "line_users_userId_key" ON "line_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_lineUserId_key" ON "users"("lineUserId");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_lineUserId_fkey" FOREIGN KEY ("lineUserId") REFERENCES "line_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_users" ADD CONSTRAINT "line_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

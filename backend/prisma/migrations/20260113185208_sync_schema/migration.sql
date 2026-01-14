/*
  Warnings:

  - You are about to drop the column `billingYear` on the `bills` table. All the data in the column will be lost.
  - The `billingMonth` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `message` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `chat_messages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `chat_rooms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatRoomId` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `chat_rooms` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'system');

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_roomId_fkey";

-- DropIndex
DROP INDEX "bills_billingMonth_billingYear_idx";

-- DropIndex
DROP INDEX "bills_status_idx";

-- DropIndex
DROP INDEX "bills_tenantId_billingMonth_billingYear_key";

-- DropIndex
DROP INDEX "bills_tenantId_idx";

-- DropIndex
DROP INDEX "chat_messages_roomId_idx";

-- DropIndex
DROP INDEX "chat_rooms_tenantId_key";

-- AlterTable
ALTER TABLE "bills" DROP COLUMN "billingYear",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "billingMonth",
ADD COLUMN     "billingMonth" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "rentAmount" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "message",
DROP COLUMN "roomId",
ADD COLUMN     "chatRoomId" TEXT NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'text',
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "senderId" DROP NOT NULL,
ALTER COLUMN "senderName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "adminUserId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestUserId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "bill_items" (
    "id" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "billId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bills_billingMonth_idx" ON "bills"("billingMonth");

-- CreateIndex
CREATE INDEX "chat_messages_chatRoomId_idx" ON "chat_messages"("chatRoomId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_sessionId_key" ON "chat_rooms"("sessionId");

-- CreateIndex
CREATE INDEX "chat_rooms_tenantId_idx" ON "chat_rooms"("tenantId");

-- CreateIndex
CREATE INDEX "chat_rooms_guestUserId_idx" ON "chat_rooms"("guestUserId");

-- CreateIndex
CREATE INDEX "chat_rooms_adminUserId_idx" ON "chat_rooms"("adminUserId");

-- CreateIndex
CREATE INDEX "chat_rooms_sessionId_idx" ON "chat_rooms"("sessionId");

-- CreateIndex
CREATE INDEX "chat_rooms_lastMessageAt_idx" ON "chat_rooms"("lastMessageAt");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

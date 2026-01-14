-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'guest';

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "images" TEXT[];

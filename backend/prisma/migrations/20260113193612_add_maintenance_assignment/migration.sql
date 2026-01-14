-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "assignedById" TEXT,
ADD COLUMN     "assignedTo" TEXT;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

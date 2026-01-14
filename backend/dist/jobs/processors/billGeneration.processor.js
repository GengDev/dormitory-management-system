"use strict";
/**
 * Bill Generation Job Processor
 *
 * Process bill generation jobs สำหรับสร้างบิลรายเดือน
 *
 * @module server/src/jobs/processors/billGeneration.processor
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBillGenerationJob = processBillGenerationJob;
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Process Bill Generation Job
 *
 * @param data - Job data { tenantId, billingMonth, dueDate }
 * @returns Processing result
 *
 * @description
 * สร้างบิลให้ผู้เช่าคนหนึ่งในเดือนที่กำหนด
 * คำนวณค่าน้ำค่าไฟจาก utilities records
 */
async function processBillGenerationJob(data) {
    try {
        const { tenantId, billingMonth, dueDate } = data;
        // Get tenant with room
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                room: true,
            },
        });
        if (!tenant || tenant.status !== 'active' || tenant.deletedAt) {
            logger_1.logger.warn(`Cannot generate bill: tenant ${tenantId} not found or inactive`);
            return { success: false };
        }
        if (!tenant.roomId || !tenant.room) {
            logger_1.logger.warn(`Cannot generate bill: tenant ${tenantId} is not assigned to a room`);
            return { success: false };
        }
        const billingMonthDate = new Date(billingMonth);
        const startOfMonth = new Date(billingMonthDate.getFullYear(), billingMonthDate.getMonth(), 1);
        const endOfMonth = new Date(billingMonthDate.getFullYear(), billingMonthDate.getMonth() + 1, 0);
        // Check if bill already exists
        const existingBill = await prisma.bill.findFirst({
            where: {
                tenantId,
                billingMonth: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                deletedAt: null,
            },
        });
        if (existingBill) {
            logger_1.logger.info(`Bill already exists for tenant ${tenantId} in ${billingMonth}`);
            return { success: true, billId: existingBill.id };
        }
        // Get utilities record for this month
        const utilities = await prisma.roomUtility.findFirst({
            where: {
                roomId: tenant.roomId,
                recordMonth: startOfMonth,
                deletedAt: null,
            },
        });
        // Build bill items
        const items = [];
        // Rent
        items.push({
            itemType: 'rent',
            description: `ค่าเช่าห้อง เดือน${billingMonthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
            quantity: 1,
            unitPrice: Number(tenant.room.monthlyRent),
            amount: Number(tenant.room.monthlyRent),
        });
        // Water
        if (utilities && utilities.waterCost > 0) {
            items.push({
                itemType: 'water',
                description: `ค่าน้ำ เดือน${billingMonthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
                quantity: Number(utilities.waterUsage || 0),
                unitPrice: Number(utilities.waterRate),
                amount: Number(utilities.waterCost),
                metadata: {
                    previousReading: utilities.waterPreviousReading,
                    currentReading: utilities.waterCurrentReading,
                },
            });
        }
        // Electricity
        if (utilities && utilities.electricityCost > 0) {
            items.push({
                itemType: 'electricity',
                description: `ค่าไฟ เดือน${billingMonthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
                quantity: Number(utilities.electricityUsage || 0),
                unitPrice: Number(utilities.electricityRate),
                amount: Number(utilities.electricityCost),
                metadata: {
                    previousReading: utilities.electricityPreviousReading,
                    currentReading: utilities.electricityCurrentReading,
                },
            });
        }
        // Create bill with items in transaction
        const bill = await prisma.$transaction(async (tx) => {
            const newBill = await tx.bill.create({
                data: {
                    tenantId,
                    roomId: tenant.roomId,
                    billingMonth: startOfMonth,
                    dueDate: new Date(dueDate),
                },
            });
            const billItems = await Promise.all(items.map((item) => tx.billItem.create({
                data: {
                    billId: newBill.id,
                    ...item,
                },
            })));
            const totalAmount = billItems.reduce((sum, item) => sum + Number(item.amount), 0);
            const updatedBill = await tx.bill.update({
                where: { id: newBill.id },
                data: {
                    subtotal: totalAmount,
                    totalAmount,
                },
            });
            return updatedBill;
        });
        logger_1.logger.info(`Bill generated successfully`, {
            billId: bill.id,
            tenantId,
            billingMonth,
        });
        // Queue notification job
        // This would be handled by the notification service
        // await notificationQueue.add('send-line-notification', {
        //   tenantId,
        //   billId: bill.id,
        //   notificationType: 'bill_due',
        // });
        return {
            success: true,
            billId: bill.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to process bill generation job', {
            error: error.message,
            data,
        });
        throw error;
    }
}
//# sourceMappingURL=billGeneration.processor.js.map
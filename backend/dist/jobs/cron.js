"use strict";
/**
 * Cron Jobs Configuration
 *
 * Scheduled tasks สำหรับระบบ
 *
 * @module server/src/jobs/cron
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronJobs = initializeCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const queue_1 = require("./queue");
const queue_2 = require("./queue");
const prisma = new client_1.PrismaClient();
/**
 * Initialize Cron Jobs
 *
 * @description
 * Setup scheduled tasks:
 * - Daily bill due notifications (9:00 AM)
 * - Daily overdue bill notifications (10:00 AM)
 * - Monthly bill generation (1st of month, 8:00 AM)
 */
function initializeCronJobs() {
    /**
     * Daily Bill Due Notifications
     *
     * Every day at 9:00 AM
     * Send notifications for bills due in 3 days
     */
    node_cron_1.default.schedule('0 9 * * *', async () => {
        logger_1.logger.info('Running daily bill due notifications cron job');
        try {
            const threeDaysLater = new Date();
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);
            const bills = await prisma.bill.findMany({
                where: {
                    status: 'pending',
                    dueDate: {
                        gte: new Date(),
                        lte: threeDaysLater,
                    },
                    deletedAt: null,
                },
                include: {
                    tenant: {
                        include: {
                            lineUser: true,
                        },
                    },
                },
            });
            for (const bill of bills) {
                if (bill.tenant.lineUser) {
                    await queue_1.notificationQueue.add('send-line-notification', {
                        tenantId: bill.tenantId,
                        billId: bill.id,
                        notificationType: 'bill_due',
                    });
                }
            }
            logger_1.logger.info(`Queued ${bills.length} bill due notifications`);
        }
        catch (error) {
            logger_1.logger.error('Error in bill due notifications cron job', { error: error.message });
        }
    });
    /**
     * Daily Overdue Bill Notifications
     *
     * Every day at 10:00 AM
     * Send notifications for overdue bills
     */
    node_cron_1.default.schedule('0 10 * * *', async () => {
        logger_1.logger.info('Running daily overdue bill notifications cron job');
        try {
            const bills = await prisma.bill.findMany({
                where: {
                    status: 'pending',
                    dueDate: { lt: new Date() },
                    deletedAt: null,
                },
                include: {
                    tenant: {
                        include: {
                            lineUser: true,
                        },
                    },
                },
            });
            for (const bill of bills) {
                if (bill.tenant.lineUser) {
                    await queue_1.notificationQueue.add('send-line-notification', {
                        tenantId: bill.tenantId,
                        billId: bill.id,
                        notificationType: 'bill_overdue',
                    });
                }
            }
            logger_1.logger.info(`Queued ${bills.length} overdue bill notifications`);
        }
        catch (error) {
            logger_1.logger.error('Error in overdue bill notifications cron job', { error: error.message });
        }
    });
    /**
     * Monthly Bill Generation
     *
     * Every month on the 1st at 8:00 AM
     * Generate bills for all active tenants
     */
    node_cron_1.default.schedule('0 8 1 * *', async () => {
        logger_1.logger.info('Running monthly bill generation cron job');
        try {
            const billingMonth = new Date();
            billingMonth.setDate(1);
            const dueDate = new Date(billingMonth);
            dueDate.setDate(dueDate.getDate() + 10); // Due date is 10 days after billing month
            const tenants = await prisma.tenant.findMany({
                where: {
                    status: 'active',
                    deletedAt: null,
                    contractStartDate: { lte: new Date() },
                    OR: [
                        { contractEndDate: null },
                        { contractEndDate: { gte: billingMonth } },
                    ],
                },
            });
            for (const tenant of tenants) {
                await queue_2.billGenerationQueue.add('generate-bill', {
                    tenantId: tenant.id,
                    billingMonth: billingMonth.toISOString(),
                    dueDate: dueDate.toISOString(),
                });
            }
            logger_1.logger.info(`Queued ${tenants.length} bill generation jobs`);
        }
        catch (error) {
            logger_1.logger.error('Error in monthly bill generation cron job', { error: error.message });
        }
    });
    logger_1.logger.info('Cron jobs initialized');
}
//# sourceMappingURL=cron.js.map
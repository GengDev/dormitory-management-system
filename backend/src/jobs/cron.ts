/**
 * Cron Jobs Configuration
 * 
 * Scheduled tasks สำหรับระบบ
 * 
 * @module server/src/jobs/cron
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { notificationQueue } from './queue';
import { billGenerationQueue } from './queue';

const prisma = new PrismaClient();

/**
 * Initialize Cron Jobs
 * 
 * @description
 * Setup scheduled tasks:
 * - Daily bill due notifications (9:00 AM)
 * - Daily overdue bill notifications (10:00 AM)
 * - Monthly bill generation (1st of month, 8:00 AM)
 */
export function initializeCronJobs(): void {
  /**
   * Daily Bill Due Notifications
   * 
   * Every day at 9:00 AM
   * Send notifications for bills due in 3 days
   */
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running daily bill due notifications cron job');

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
          await notificationQueue.add('send-line-notification', {
            tenantId: bill.tenantId,
            billId: bill.id,
            notificationType: 'bill_due',
          });
        }
      }

      logger.info(`Queued ${bills.length} bill due notifications`);
    } catch (error: any) {
      logger.error('Error in bill due notifications cron job', { error: error.message });
    }
  });

  /**
   * Daily Overdue Bill Notifications
   * 
   * Every day at 10:00 AM
   * Send notifications for overdue bills
   */
  cron.schedule('0 10 * * *', async () => {
    logger.info('Running daily overdue bill notifications cron job');

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
          await notificationQueue.add('send-line-notification', {
            tenantId: bill.tenantId,
            billId: bill.id,
            notificationType: 'bill_overdue',
          });
        }
      }

      logger.info(`Queued ${bills.length} overdue bill notifications`);
    } catch (error: any) {
      logger.error('Error in overdue bill notifications cron job', { error: error.message });
    }
  });

  /**
   * Monthly Bill Generation
   * 
   * Every month on the 1st at 8:00 AM
   * Generate bills for all active tenants
   */
  cron.schedule('0 8 1 * *', async () => {
    logger.info('Running monthly bill generation cron job');

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
        await billGenerationQueue.add('generate-bill', {
          tenantId: tenant.id,
          billingMonth: billingMonth.toISOString(),
          dueDate: dueDate.toISOString(),
        });
      }

      logger.info(`Queued ${tenants.length} bill generation jobs`);
    } catch (error: any) {
      logger.error('Error in monthly bill generation cron job', { error: error.message });
    }
  });

  logger.info('Cron jobs initialized');
}


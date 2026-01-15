/**
 * Bull Queue Configuration
 * 
 * Setup และ configuration สำหรับ background job queues
 * 
 * @module server/src/jobs/queue
 */

import Bull from 'bull';
import { logger } from '../utils/logger';
import { processNotificationJob } from './processors/notification.processor';
import { processBillGenerationJob } from './processors/billGeneration.processor';

/**
 * Redis Configuration
 */
const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  };

/**
 * Notification Queue
 * 
 * สำหรับส่ง LINE notifications
 */
export const notificationQueue = process.env.REDIS_URL
  ? new Bull('notifications', process.env.REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  })
  : new Bull('notifications', {
    redis: redisConfig as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  });

/**
 * Bill Generation Queue
 * 
 * สำหรับสร้างบิลรายเดือน
 */
export const billGenerationQueue = process.env.REDIS_URL
  ? new Bull('bill-generation', process.env.REDIS_URL, {
    settings: { maxStalledCount: 1 }
  })
  : new Bull('bill-generation', {
    redis: redisConfig as any,
    settings: {
      maxStalledCount: 1,
    },
  });

/**
 * Initialize Queues
 * 
 * Setup job processors
 */
export function initializeBullQueues(): void {
  // Process notification jobs
  notificationQueue.process('send-line-notification', 10, async (job) => {
    logger.info(`Processing notification job: ${job.id}`, { data: job.data });
    return await processNotificationJob(job.data);
  });

  // Process bill generation jobs
  billGenerationQueue.process('generate-bill', 5, async (job) => {
    logger.info(`Processing bill generation job: ${job.id}`, { data: job.data });
    return await processBillGenerationJob(job.data);
  });

  // Queue event handlers
  notificationQueue.on('completed', (job, result) => {
    logger.info(`Notification job completed: ${job.id}`, { result });
  });

  notificationQueue.on('failed', (job, error) => {
    logger.error(`Notification job failed: ${job?.id}`, { error: error.message });
  });

  billGenerationQueue.on('completed', (job, result) => {
    logger.info(`Bill generation job completed: ${job.id}`, { result });
  });

  billGenerationQueue.on('failed', (job, error) => {
    logger.error(`Bill generation job failed: ${job?.id}`, { error: error.message });
  });

  logger.info('Bull queues initialized');
}


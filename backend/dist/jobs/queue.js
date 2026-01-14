"use strict";
/**
 * Bull Queue Configuration
 *
 * Setup และ configuration สำหรับ background job queues
 *
 * @module server/src/jobs/queue
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billGenerationQueue = exports.notificationQueue = void 0;
exports.initializeBullQueues = initializeBullQueues;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const notification_processor_1 = require("./processors/notification.processor");
const billGeneration_processor_1 = require("./processors/billGeneration.processor");
/**
 * Redis Configuration
 */
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
};
/**
 * Notification Queue
 *
 * สำหรับส่ง LINE notifications
 */
exports.notificationQueue = new bull_1.default('notifications', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
    },
});
/**
 * Bill Generation Queue
 *
 * สำหรับสร้างบิลรายเดือน
 */
exports.billGenerationQueue = new bull_1.default('bill-generation', {
    redis: redisConfig,
    settings: {
        maxStalledCount: 1,
    },
});
/**
 * Initialize Queues
 *
 * Setup job processors
 */
function initializeBullQueues() {
    // Process notification jobs
    exports.notificationQueue.process('send-line-notification', 10, async (job) => {
        logger_1.logger.info(`Processing notification job: ${job.id}`, { data: job.data });
        return await (0, notification_processor_1.processNotificationJob)(job.data);
    });
    // Process bill generation jobs
    exports.billGenerationQueue.process('generate-bill', 5, async (job) => {
        logger_1.logger.info(`Processing bill generation job: ${job.id}`, { data: job.data });
        return await (0, billGeneration_processor_1.processBillGenerationJob)(job.data);
    });
    // Queue event handlers
    exports.notificationQueue.on('completed', (job, result) => {
        logger_1.logger.info(`Notification job completed: ${job.id}`, { result });
    });
    exports.notificationQueue.on('failed', (job, error) => {
        logger_1.logger.error(`Notification job failed: ${job?.id}`, { error: error.message });
    });
    exports.billGenerationQueue.on('completed', (job, result) => {
        logger_1.logger.info(`Bill generation job completed: ${job.id}`, { result });
    });
    exports.billGenerationQueue.on('failed', (job, error) => {
        logger_1.logger.error(`Bill generation job failed: ${job?.id}`, { error: error.message });
    });
    logger_1.logger.info('Bull queues initialized');
}
//# sourceMappingURL=queue.js.map
/**
 * Bull Queue Configuration
 *
 * Setup และ configuration สำหรับ background job queues
 *
 * @module server/src/jobs/queue
 */
import Bull from 'bull';
/**
 * Notification Queue
 *
 * สำหรับส่ง LINE notifications
 */
export declare const notificationQueue: Bull.Queue<any>;
/**
 * Bill Generation Queue
 *
 * สำหรับสร้างบิลรายเดือน
 */
export declare const billGenerationQueue: Bull.Queue<any>;
/**
 * Initialize Queues
 *
 * Setup job processors
 */
export declare function initializeBullQueues(): void;
//# sourceMappingURL=queue.d.ts.map
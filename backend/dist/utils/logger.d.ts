/**
 * Logger Utility
 *
 * Winston logger configuration สำหรับ logging ทั่วทั้งระบบ
 * รองรับ console และ file logging
 *
 * @module server/src/utils/logger
 */
import winston from 'winston';
/**
 * Winston Logger Instance
 *
 * Configuration:
 * - Console: สำหรับ development
 * - File: สำหรับ production (error.log, combined.log)
 */
export declare const logger: winston.Logger;
//# sourceMappingURL=logger.d.ts.map
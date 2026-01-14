/**
 * Error Handler Middleware
 *
 * Global error handler สำหรับ Express
 * จัดการ errors และส่ง response ที่เหมาะสมกลับไปยัง client
 *
 * @module server/src/middleware/errorHandler
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Custom Error Interface
 */
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
/**
 * Error Handler Middleware
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare const errorHandler: (err: AppError, req: Request, res: Response, _next: NextFunction) => void;
/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to catch errors automatically
 *
 * @param fn - Async function to wrap
 * @returns Wrapped function
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create App Error
 *
 * Helper function to create custom errors
 *
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @returns AppError instance
 */
export declare const createError: (message: string, statusCode?: number) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map
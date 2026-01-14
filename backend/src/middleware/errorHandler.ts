/**
 * Error Handler Middleware
 * 
 * Global error handler สำหรับ Express
 * จัดการ errors และส่ง response ที่เหมาะสมกลับไปยัง client
 * 
 * @module server/src/middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

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
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error(`${req.method} ${req.path} - ${statusCode} - ${message}`, {
    error: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

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
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create App Error
 * 
 * Helper function to create custom errors
 * 
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @returns AppError instance
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};


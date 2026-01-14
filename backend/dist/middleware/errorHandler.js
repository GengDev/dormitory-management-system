"use strict";
/**
 * Error Handler Middleware
 *
 * Global error handler สำหรับ Express
 * จัดการ errors และส่ง response ที่เหมาะสมกลับไปยัง client
 *
 * @module server/src/middleware/errorHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.asyncHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
/**
 * Error Handler Middleware
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error
    logger_1.logger.error(`${req.method} ${req.path} - ${statusCode} - ${message}`, {
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
exports.errorHandler = errorHandler;
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
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Create App Error
 *
 * Helper function to create custom errors
 *
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @returns AppError instance
 */
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map
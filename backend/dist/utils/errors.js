"use strict";
/**
 * Custom Error Classes for Better Error Handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceError = exports.DatabaseError = exports.InternalServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.formatErrorResponse = formatErrorResponse;
/**
 * Base Application Error
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors) {
        super(message, 400, true, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication Error (401)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization Error (403)
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, true, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict Error (409)
 */
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, true, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
/**
 * Rate Limit Error (429)
 */
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Internal Server Error (500)
 */
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, false, 'INTERNAL_SERVER_ERROR');
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Database Error (500)
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, false, 'DATABASE_ERROR');
    }
}
exports.DatabaseError = DatabaseError;
/**
 * External Service Error (502)
 */
class ExternalServiceError extends AppError {
    constructor(service, message) {
        super(message || `External service ${service} is unavailable`, 502, true, 'EXTERNAL_SERVICE_ERROR');
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * Format error for API response
 */
function formatErrorResponse(error, includeStack = false) {
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                statusCode: error.statusCode,
                errors: error.errors,
                ...(includeStack && { stack: error.stack }),
            },
        };
    }
    // Handle unknown errors
    return {
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'An unexpected error occurred',
            statusCode: 500,
            ...(includeStack && { stack: error.stack }),
        },
    };
}
//# sourceMappingURL=errors.js.map
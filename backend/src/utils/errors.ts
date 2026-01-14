/**
 * Custom Error Classes for Better Error Handling
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        code?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
    public readonly errors?: any[];

    constructor(message: string = 'Validation failed', errors?: any[]) {
        super(message, 400, true, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, true, 'NOT_FOUND');
    }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, true, 'CONFLICT');
    }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
    }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(message, 500, false, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
        super(message, 500, false, 'DATABASE_ERROR');
    }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, message?: string) {
        super(
            message || `External service ${service} is unavailable`,
            502,
            true,
            'EXTERNAL_SERVICE_ERROR'
        );
    }
}

/**
 * Error Response Format
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        errors?: any[];
        stack?: string;
    };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
    error: AppError | Error,
    includeStack: boolean = false
): ErrorResponse {
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                statusCode: error.statusCode,
                errors: (error as ValidationError).errors,
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

/**
 * Custom Error Classes for Better Error Handling
 */
/**
 * Base Application Error
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    constructor(message: string, statusCode?: number, isOperational?: boolean, code?: string);
}
/**
 * Validation Error (400)
 */
export declare class ValidationError extends AppError {
    readonly errors?: any[];
    constructor(message?: string, errors?: any[]);
}
/**
 * Authentication Error (401)
 */
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
/**
 * Authorization Error (403)
 */
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
/**
 * Not Found Error (404)
 */
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
/**
 * Conflict Error (409)
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * Rate Limit Error (429)
 */
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Internal Server Error (500)
 */
export declare class InternalServerError extends AppError {
    constructor(message?: string);
}
/**
 * Database Error (500)
 */
export declare class DatabaseError extends AppError {
    constructor(message?: string);
}
/**
 * External Service Error (502)
 */
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message?: string);
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
export declare function formatErrorResponse(error: AppError | Error, includeStack?: boolean): ErrorResponse;
//# sourceMappingURL=errors.d.ts.map
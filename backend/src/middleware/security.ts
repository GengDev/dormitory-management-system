import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import { RateLimitError } from '../utils/errors';

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    },
});

/**
 * Add CSRF Token to Response
 */
export function addCsrfToken(req: Request, res: Response, next: NextFunction) {
    res.locals.csrfToken = (req as any).csrfToken();
    next();
}

/**
 * Request Size Limit Middleware
 */
export function requestSizeLimit(maxSize: string = '10mb') {
    return (req: Request, _res: Response, next: NextFunction) => {
        const contentLength = req.get('content-length');

        if (contentLength) {
            const sizeInMB = parseInt(contentLength) / (1024 * 1024);
            const maxSizeInMB = parseInt(maxSize);

            if (sizeInMB > maxSizeInMB) {
                _res.status(413).json({
                    success: false,
                    error: {
                        code: 'PAYLOAD_TOO_LARGE',
                        message: `Request size exceeds ${maxSize} limit`,
                        statusCode: 413,
                    },
                });
                return;
            }
        }

        next();
    };
}

/**
 * IP Whitelist Middleware
 */
export function ipWhitelist(allowedIPs: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const clientIP = req.ip || req.connection.remoteAddress;

        if (!clientIP || !allowedIPs.includes(clientIP)) {
            _res.status(403).json({
                success: false,
                error: {
                    code: 'IP_NOT_ALLOWED',
                    message: 'Access denied from this IP address',
                    statusCode: 403,
                },
            });
            return;
        }

        next();
    };
}

/**
 * User-based Rate Limiting
 */
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

export function userRateLimit(maxRequests: number = 100, windowMs: number = 900000) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return next();
        }

        const now = Date.now();
        const userLimit = userRateLimits.get(userId);

        if (!userLimit || now > userLimit.resetTime) {
            userRateLimits.set(userId, {
                count: 1,
                resetTime: now + windowMs,
            });
            return next();
        }

        if (userLimit.count >= maxRequests) {
            throw new RateLimitError('Too many requests from this user');
        }

        userLimit.count++;
        next();
    };
}

/**
 * API Key Validation Middleware
 */
export function validateApiKey(req: Request, _res: Response, next: NextFunction) {
    const apiKey = req.get('X-API-Key');
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
        return next(); // Skip if no API key is configured
    }

    if (!apiKey || apiKey !== validApiKey) {
        _res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_API_KEY',
                message: 'Invalid or missing API key',
                statusCode: 401,
            },
        });
        return;
    }

    next();
}

/**
 * Secure Headers Middleware (additional to helmet)
 */
export function secureHeaders(_req: Request, res: Response, next: NextFunction) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
}

/**
 * Content Security Policy
 */
export function contentSecurityPolicy(_req: Request, res: Response, next: NextFunction) {
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);
    next();
}

/**
 * Prevent Parameter Pollution
 */
export function preventParameterPollution(req: Request, _res: Response, next: NextFunction) {
    // Convert array parameters to single values (take first value)
    for (const key in req.query) {
        if (Array.isArray(req.query[key])) {
            req.query[key] = (req.query[key] as string[])[0];
        }
    }

    next();
}

/**
 * Request ID Middleware
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
    const id = req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (req as any).requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
}

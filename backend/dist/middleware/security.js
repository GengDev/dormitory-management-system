"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
exports.addCsrfToken = addCsrfToken;
exports.requestSizeLimit = requestSizeLimit;
exports.ipWhitelist = ipWhitelist;
exports.userRateLimit = userRateLimit;
exports.validateApiKey = validateApiKey;
exports.secureHeaders = secureHeaders;
exports.contentSecurityPolicy = contentSecurityPolicy;
exports.preventParameterPollution = preventParameterPollution;
exports.requestId = requestId;
const csurf_1 = __importDefault(require("csurf"));
const errors_1 = require("../utils/errors");
/**
 * CSRF Protection Middleware
 */
exports.csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    },
});
/**
 * Add CSRF Token to Response
 */
function addCsrfToken(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
}
/**
 * Request Size Limit Middleware
 */
function requestSizeLimit(maxSize = '10mb') {
    return (req, res, next) => {
        const contentLength = req.get('content-length');
        if (contentLength) {
            const sizeInMB = parseInt(contentLength) / (1024 * 1024);
            const maxSizeInMB = parseInt(maxSize);
            if (sizeInMB > maxSizeInMB) {
                return res.status(413).json({
                    success: false,
                    error: {
                        code: 'PAYLOAD_TOO_LARGE',
                        message: `Request size exceeds ${maxSize} limit`,
                        statusCode: 413,
                    },
                });
            }
        }
        next();
    };
}
/**
 * IP Whitelist Middleware
 */
function ipWhitelist(allowedIPs) {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!clientIP || !allowedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'IP_NOT_ALLOWED',
                    message: 'Access denied from this IP address',
                    statusCode: 403,
                },
            });
        }
        next();
    };
}
/**
 * User-based Rate Limiting
 */
const userRateLimits = new Map();
function userRateLimit(maxRequests = 100, windowMs = 900000) {
    return (req, res, next) => {
        const userId = req.user?.userId;
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
            throw new errors_1.RateLimitError('Too many requests from this user');
        }
        userLimit.count++;
        next();
    };
}
/**
 * API Key Validation Middleware
 */
function validateApiKey(req, res, next) {
    const apiKey = req.get('X-API-Key');
    const validApiKey = process.env.API_KEY;
    if (!validApiKey) {
        return next(); // Skip if no API key is configured
    }
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_API_KEY',
                message: 'Invalid or missing API key',
                statusCode: 401,
            },
        });
    }
    next();
}
/**
 * Secure Headers Middleware (additional to helmet)
 */
function secureHeaders(req, res, next) {
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
function contentSecurityPolicy(req, res, next) {
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
function preventParameterPollution(req, res, next) {
    // Convert array parameters to single values (take first value)
    for (const key in req.query) {
        if (Array.isArray(req.query[key])) {
            req.query[key] = req.query[key][0];
        }
    }
    next();
}
/**
 * Request ID Middleware
 */
function requestId(req, res, next) {
    const id = req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
}
//# sourceMappingURL=security.js.map
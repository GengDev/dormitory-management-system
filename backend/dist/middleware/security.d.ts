import { Request, Response, NextFunction } from 'express';
/**
 * CSRF Protection Middleware
 */
export declare const csrfProtection: any;
/**
 * Add CSRF Token to Response
 */
export declare function addCsrfToken(req: Request, res: Response, next: NextFunction): void;
/**
 * Request Size Limit Middleware
 */
export declare function requestSizeLimit(maxSize?: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * IP Whitelist Middleware
 */
export declare function ipWhitelist(allowedIPs: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function userRateLimit(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * API Key Validation Middleware
 */
export declare function validateApiKey(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Secure Headers Middleware (additional to helmet)
 */
export declare function secureHeaders(req: Request, res: Response, next: NextFunction): void;
/**
 * Content Security Policy
 */
export declare function contentSecurityPolicy(req: Request, res: Response, next: NextFunction): void;
/**
 * Prevent Parameter Pollution
 */
export declare function preventParameterPollution(req: Request, res: Response, next: NextFunction): void;
/**
 * Request ID Middleware
 */
export declare function requestId(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=security.d.ts.map
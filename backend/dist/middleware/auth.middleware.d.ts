/**
 * Authentication Middleware
 *
 * JWT authentication middleware สำหรับ protect routes
 * ตรวจสอบและ verify JWT token จาก Authorization header
 *
 * @module server/src/middleware/auth.middleware
 */
import { Request, Response, NextFunction } from 'express';
/**
 * JWT Payload Interface
 */
export interface JWTPayload {
    userId: string;
    email: string;
    role: 'admin' | 'tenant' | 'guest';
    iat?: number;
    exp?: number;
}
/**
 * Extended Request Interface with User
 */
export interface AuthRequest extends Request {
    user?: JWTPayload & {
        id: string;
    };
}
/**
 * Authentication Middleware
 *
 * Verifies JWT token และ attach user info ไปยัง request object
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @throws {401} หาก token ไม่ถูกต้องหรือหมดอายุ
 */
export declare const authenticate: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Role-based Authorization Middleware
 *
 * ตรวจสอบว่า user มี role ที่เหมาะสมหรือไม่
 *
 * @param roles - Array of allowed roles
 * @returns Middleware function
 *
 * @example
 * router.get('/admin/users', authenticate, authorize(['admin']), getUsers);
 */
export declare const authorize: (roles: ("admin" | "tenant" | "guest")[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
/**
 * Optional Authentication Middleware
 *
 * Similar to authenticate แต่ไม่ throw error ถ้าไม่มี token
 * ใช้สำหรับ routes ที่รองรับทั้ง authenticated และ anonymous users
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare const optionalAuth: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map
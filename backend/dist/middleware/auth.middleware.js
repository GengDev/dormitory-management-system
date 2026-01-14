"use strict";
/**
 * Authentication Middleware
 *
 * JWT authentication middleware สำหรับ protect routes
 * ตรวจสอบและ verify JWT token จาก Authorization header
 *
 * @module server/src/middleware/auth.middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
const authenticate = async (req, _res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw (0, errorHandler_1.createError)('No token provided', 401);
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token) {
            throw (0, errorHandler_1.createError)('No token provided', 401);
        }
        // Verify token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET is not configured');
            throw (0, errorHandler_1.createError)('Server configuration error', 500);
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Check if user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                deletedAt: true,
            },
        });
        if (!user || !user.isActive || user.deletedAt) {
            throw (0, errorHandler_1.createError)('User not found or inactive', 401);
        }
        // Attach user to request
        req.user = {
            ...decoded,
            id: user.id,
        };
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next((0, errorHandler_1.createError)('Invalid token', 401));
        }
        else if (error.name === 'TokenExpiredError') {
            next((0, errorHandler_1.createError)('Token expired', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
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
const authorize = (roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next((0, errorHandler_1.createError)('Authentication required', 401));
            return;
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn(`Unauthorized access attempt by user ${req.user.userId}`, {
                requiredRoles: roles,
                userRole: req.user.role,
                path: req.path,
            });
            next((0, errorHandler_1.createError)('Insufficient permissions', 403));
            return;
        }
        next();
    };
};
exports.authorize = authorize;
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
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                    const user = await prisma.user.findUnique({
                        where: { id: decoded.userId },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            isActive: true,
                            deletedAt: true,
                        },
                    });
                    if (user && user.isActive && !user.deletedAt) {
                        req.user = {
                            ...decoded,
                            id: user.id,
                        };
                    }
                }
                catch (error) {
                    // Ignore token errors for optional auth
                }
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map
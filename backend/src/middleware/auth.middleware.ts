/**
 * Authentication Middleware
 * 
 * JWT authentication middleware สำหรับ protect routes
 * ตรวจสอบและ verify JWT token จาก Authorization header
 * 
 * @module server/src/middleware/auth.middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw createError('No token provided', 401);
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      throw createError('Server configuration error', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

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
      throw createError('User not found or inactive', 401);
    }

    // Attach user to request
    req.user = {
      ...decoded,
      id: user.id,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(createError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(createError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

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
export const authorize = (roles: ('admin' | 'tenant' | 'guest')[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.userId}`, {
        requiredRoles: roles,
        userRole: req.user.role,
        path: req.path,
      });
      next(createError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

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
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        try {
          const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
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
        } catch (error) {
          // Ignore token errors for optional auth
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};


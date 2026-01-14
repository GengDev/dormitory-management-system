/**
 * Authentication Controller
 *
 * Controller functions สำหรับ authentication operations:
 * - Register new user
 * - Login user
 * - Refresh token
 * - Logout
 * - Get current user
 *
 * @module server/src/controllers/auth.controller
 */
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Register New User
 *
 * @route   POST /api/auth/register
 * @access  Public
 *
 * @param req - Express request (body: email, password, fullName, phone?, role?)
 * @param res - Express response
 */
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * Login User
 *
 * @route   POST /api/auth/login
 * @access  Public
 *
 * @param req - Express request (body: email, password)
 * @param res - Express response
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Refresh Access Token
 *
 * @route   POST /api/auth/refresh
 * @access  Public
 *
 * @param req - Express request (body: refreshToken)
 * @param res - Express response
 */
export declare const refreshToken: (req: Request, res: Response) => Promise<void>;
/**
 * Logout User
 *
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * @param req - Express request (with authenticated user)
 * @param res - Express response
 */
export declare const logout: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get Current User
 *
 * @route   GET /api/auth/me
 * @access  Private
 *
 * @param req - Express request (with authenticated user)
 * @param res - Express response
 */
export declare const getCurrentUser: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map
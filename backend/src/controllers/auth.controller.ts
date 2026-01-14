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
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Generate JWT Tokens
 * 
 * @param userId - User ID
 * @param email - User email
 * @param role - User role
 * @returns Object containing accessToken and refreshToken
 */
const generateTokens = (userId: string, email: string, role: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  if (!jwtSecret || !jwtRefreshSecret) {
    throw createError('JWT secrets not configured', 500);
  }

  const accessToken = jwt.sign({ userId, email, role }, jwtSecret as string, {
    expiresIn: jwtExpiresIn as any,
  });

  const refreshToken = jwt.sign({ userId, email, role }, jwtRefreshSecret as string, {
    expiresIn: jwtRefreshExpiresIn as any,
  });

  return { accessToken, refreshToken };
};

/**
 * Register New User
 * 
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * @param req - Express request (body: email, password, fullName, phone?, role?)
 * @param res - Express response
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, role = 'guest' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role: (role as Role) || Role.guest,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role
    );

    logger.info(`New user registered: ${user.email}`, { userId: user.id });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
    });
  }
};

/**
 * Login User
 * 
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * @param req - Express request (body: email, password)
 * @param res - Express response
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    logger.info(`User found: ${!!user}`);

    if (!user || user.deletedAt) {
      logger.info(`User not found or deleted for email: ${email}`);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, (user as any).passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role
    );

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to login',
    });
  }
};

/**
 * Refresh Access Token
 * 
 * @route   POST /api/auth/refresh
 * @access  Public
 * 
 * @param req - Express request (body: refreshToken)
 * @param res - Express response
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw createError('JWT refresh secret not configured', 500);
    }

    // Verify refresh token
    const decoded = jwt.verify(token, jwtRefreshSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    logger.error('Refresh token error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
};

/**
 * Logout User
 * 
 * @route   POST /api/auth/logout
 * @access  Private
 * 
 * @param req - Express request (with authenticated user)
 * @param res - Express response
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // In a real application, you might want to:
    // 1. Store refresh token in blacklist (Redis)
    // 2. Remove token from database
    // For now, we'll just return success

    logger.info(`User logged out: ${req.user?.email}`, { userId: req.user?.userId });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
};

/**
 * Get Current User
 * 
 * @route   GET /api/auth/me
 * @access  Private
 * 
 * @param req - Express request (with authenticated user)
 * @param res - Express response
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    logger.error('Get current user error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
    });
  }
};


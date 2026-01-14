/**
 * Authentication Routes
 * 
 * Routes สำหรับ authentication: login, register, refresh token, logout
 * 
 * @module server/src/routes/auth.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, refreshToken, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 * @body    { email, password, fullName, phone?, role? }
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    body('phone').optional().isMobilePhone('th-TH').withMessage('Invalid phone number'),
    body('role').optional().isIn(['admin', 'tenant', 'guest']).withMessage('Invalid role'),
  ],
  validateRequest,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post(
  '/login',
  [
    body('email').isLength({ min: 1 }).withMessage('Email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
  ],
  validateRequest,
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validateRequest,
  refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile (alias for /me)
 * @access  Private
 */
router.get('/profile', authenticate, getCurrentUser);

export default router;


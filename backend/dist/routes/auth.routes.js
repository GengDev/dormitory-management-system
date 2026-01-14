"use strict";
/**
 * Authentication Routes
 *
 * Routes สำหรับ authentication: login, register, refresh token, logout
 *
 * @module server/src/routes/auth.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 * @body    { email, password, fullName, phone?, role? }
 */
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email must be valid'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    (0, express_validator_1.body)('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('th-TH').withMessage('Invalid phone number'),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'tenant', 'guest']).withMessage('Invalid role'),
], validate_middleware_1.validateRequest, auth_controller_1.register);
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', [
    (0, express_validator_1.body)('email').isLength({ min: 1 }).withMessage('Email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 1 }).withMessage('Password is required'),
], validate_middleware_1.validateRequest, auth_controller_1.login);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', [(0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required')], validate_middleware_1.validateRequest, auth_controller_1.refreshToken);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.logout);
/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getCurrentUser);
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile (alias for /me)
 * @access  Private
 */
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
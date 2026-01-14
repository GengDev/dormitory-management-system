"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Generate JWT Tokens
 *
 * @param userId - User ID
 * @param email - User email
 * @param role - User role
 * @returns Object containing accessToken and refreshToken
 */
const generateTokens = (userId, email, role) => {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    if (!jwtSecret || !jwtRefreshSecret) {
        throw (0, errorHandler_1.createError)('JWT secrets not configured', 500);
    }
    const accessToken = jsonwebtoken_1.default.sign({ userId, email, role }, jwtSecret, {
        expiresIn: jwtExpiresIn,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, email, role }, jwtRefreshSecret, {
        expiresIn: jwtRefreshExpiresIn,
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
const register = async (req, res) => {
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
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                phone,
                role: role || client_1.Role.guest,
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
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
        logger_1.logger.info(`New user registered: ${user.email}`, { userId: user.id });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                accessToken,
                refreshToken,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to register user',
        });
    }
};
exports.register = register;
/**
 * Login User
 *
 * @route   POST /api/auth/login
 * @access  Public
 *
 * @param req - Express request (body: email, password)
 * @param res - Express response
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        logger_1.logger.info(`Login attempt for email: ${email}`);
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        logger_1.logger.info(`User found: ${!!user}`);
        if (!user || user.deletedAt) {
            logger_1.logger.info(`User not found or deleted for email: ${email}`);
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
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
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
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
        logger_1.logger.info(`User logged in: ${user.email}`, { userId: user.id });
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
    }
    catch (error) {
        logger_1.logger.error('Login error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to login',
        });
    }
};
exports.login = login;
/**
 * Refresh Access Token
 *
 * @route   POST /api/auth/refresh
 * @access  Public
 *
 * @param req - Express request (body: refreshToken)
 * @param res - Express response
 */
const refreshToken = async (req, res) => {
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
            throw (0, errorHandler_1.createError)('JWT refresh secret not configured', 500);
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(token, jwtRefreshSecret);
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
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.role);
        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken,
            },
        });
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
            return;
        }
        logger_1.logger.error('Refresh token error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
        });
    }
};
exports.refreshToken = refreshToken;
/**
 * Logout User
 *
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * @param req - Express request (with authenticated user)
 * @param res - Express response
 */
const logout = async (req, res) => {
    try {
        // In a real application, you might want to:
        // 1. Store refresh token in blacklist (Redis)
        // 2. Remove token from database
        // For now, we'll just return success
        logger_1.logger.info(`User logged out: ${req.user?.email}`, { userId: req.user?.userId });
        res.json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        logger_1.logger.error('Logout error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
        });
    }
};
exports.logout = logout;
/**
 * Get Current User
 *
 * @route   GET /api/auth/me
 * @access  Private
 *
 * @param req - Express request (with authenticated user)
 * @param res - Express response
 */
const getCurrentUser = async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Get current user error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
        });
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.controller.js.map
"use strict";
/**
 * User Controller
 *
 * Controller functions สำหรับ user management operations
 *
 * @module server/src/controllers/user.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateUser = exports.activateUser = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get All Users
 *
 * @route   GET /api/users
 * @access  Private (Admin only)
 *
 * @param req - Express request (query: page, limit, role, isActive, search)
 * @param res - Express response
 */
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '20', role, isActive, search, } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Build where clause
    const where = {
        deletedAt: null,
    };
    if (role) {
        where.role = role;
    }
    if (isActive !== undefined) {
        where.isActive = isActive === 'true';
    }
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
        ];
    }
    // Get users and total count
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
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
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
    ]);
    res.json({
        success: true,
        data: users,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get User By ID
 *
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
        where: { id },
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
});
/**
 * Update User
 *
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: fullName, phone, role, isActive)
 * @param res - Express response
 */
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { fullName, phone, role, isActive } = req.body;
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id },
    });
    if (!existingUser || existingUser.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'User not found',
        });
        return;
    }
    // Build update data
    const updateData = {};
    if (fullName)
        updateData.fullName = fullName;
    if (phone)
        updateData.phone = phone;
    if (role)
        updateData.role = role;
    if (isActive !== undefined)
        updateData.isActive = isActive;
    const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            lastLoginAt: true,
            deletedAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    logger_1.logger.info(`User updated: ${user.email}`, {
        userId: user.id,
        updatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
    });
});
/**
 * Delete User (Soft Delete)
 *
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id },
    });
    if (!existingUser || existingUser.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'User not found',
        });
        return;
    }
    // Soft delete
    await prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            isActive: false,
        },
    });
    logger_1.logger.info(`User deleted: ${existingUser.email}`, {
        userId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'User deleted successfully',
    });
});
/**
 * Activate User
 *
 * @route   PATCH /api/users/:id/activate
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.activateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.update({
        where: { id },
        data: { isActive: true },
        select: {
            id: true,
            email: true,
            isActive: true,
        },
    });
    logger_1.logger.info(`User activated: ${user.email}`, {
        userId: id,
        activatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'User activated successfully',
        data: { user },
    });
});
/**
 * Deactivate User
 *
 * @route   PATCH /api/users/:id/deactivate
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deactivateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
            id: true,
            email: true,
            isActive: true,
        },
    });
    logger_1.logger.info(`User deactivated: ${user.email}`, {
        userId: id,
        deactivatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'User deactivated successfully',
        data: { user },
    });
});
//# sourceMappingURL=user.controller.js.map
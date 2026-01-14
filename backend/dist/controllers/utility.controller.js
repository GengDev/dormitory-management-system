"use strict";
/**
 * Utility Controller
 *
 * Controller functions สำหรับ utility management operations
 *
 * @module server/src/controllers/utility.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUtility = exports.updateUtility = exports.createUtility = exports.getUtilityById = exports.getUtilities = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get All Utilities
 *
 * @route   GET /api/utilities
 * @access  Private (Admin: all, Tenant: own room)
 *
 * @param req - Express request (query: roomId, recordMonth, page, limit)
 * @param res - Express response
 */
exports.getUtilities = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { roomId, recordMonth, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        deletedAt: null,
    };
    // Tenant can only see own room utilities
    if (req.user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
            where: {
                userId: req.user.userId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (tenant) {
            where.roomId = tenant.roomId;
        }
        else {
            res.json({
                success: true,
                data: [],
                meta: {
                    total: 0,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: 0,
                },
            });
            return;
        }
    }
    else if (roomId) {
        where.roomId = roomId;
    }
    if (recordMonth) {
        const month = new Date(recordMonth);
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        where.recordMonth = {
            gte: startOfMonth,
            lte: endOfMonth,
        };
    }
    const [utilities, total] = await Promise.all([
        prisma.roomUtility.findMany({
            where,
            include: {
                room: {
                    select: {
                        id: true,
                        roomNumber: true,
                        building: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: { recordMonth: 'desc' },
        }),
        prisma.roomUtility.count({ where }),
    ]);
    res.json({
        success: true,
        data: utilities,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Utility By ID
 *
 * @route   GET /api/utilities/:id
 * @access  Private
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getUtilityById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const utility = await prisma.roomUtility.findUnique({
        where: { id },
        include: {
            room: {
                include: {
                    building: true,
                },
            },
            tenant: true,
        },
    });
    if (!utility || utility.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Utility record not found',
        });
        return;
    }
    res.json({
        success: true,
        data: { utility },
    });
});
/**
 * Create Utility Record
 *
 * @route   POST /api/utilities
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: roomId, recordMonth, water/electricity readings, rates)
 * @param res - Express response
 */
exports.createUtility = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { roomId, tenantId, recordMonth, waterPreviousReading, waterCurrentReading, waterRate, electricityPreviousReading, electricityCurrentReading, electricityRate, notes, } = req.body;
    // Check if room exists
    const room = await prisma.room.findUnique({
        where: { id: roomId },
    });
    if (!room || room.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Room not found',
        });
        return;
    }
    const recordMonthDate = new Date(recordMonth);
    const startOfMonth = new Date(recordMonthDate.getFullYear(), recordMonthDate.getMonth(), 1);
    // Check if utility record already exists for this month
    const existingUtility = await prisma.roomUtility.findFirst({
        where: {
            roomId,
            recordMonth: startOfMonth,
            deletedAt: null,
        },
    });
    if (existingUtility) {
        res.status(400).json({
            success: false,
            message: 'Utility record already exists for this month',
        });
        return;
    }
    // Calculate usage and cost (trigger should handle this, but we'll calculate here too)
    const waterUsage = waterCurrentReading && waterPreviousReading
        ? parseFloat(waterCurrentReading) - parseFloat(waterPreviousReading)
        : 0;
    const waterCost = waterUsage * parseFloat(waterRate);
    const electricityUsage = electricityCurrentReading && electricityPreviousReading
        ? parseFloat(electricityCurrentReading) - parseFloat(electricityPreviousReading)
        : 0;
    const electricityCost = electricityUsage * parseFloat(electricityRate);
    const utility = await prisma.roomUtility.create({
        data: {
            roomId,
            tenantId: tenantId || null,
            recordMonth: startOfMonth,
            waterPreviousReading: waterPreviousReading ? parseFloat(waterPreviousReading) : null,
            waterCurrentReading: waterCurrentReading ? parseFloat(waterCurrentReading) : null,
            waterUsage: waterUsage > 0 ? waterUsage : null,
            waterRate: parseFloat(waterRate),
            waterCost,
            electricityPreviousReading: electricityPreviousReading
                ? parseFloat(electricityPreviousReading)
                : null,
            electricityCurrentReading: electricityCurrentReading
                ? parseFloat(electricityCurrentReading)
                : null,
            electricityUsage: electricityUsage > 0 ? electricityUsage : null,
            electricityRate: parseFloat(electricityRate),
            electricityCost,
            notes,
            recordedById: req.user?.userId,
        },
        include: {
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                },
            },
        },
    });
    logger_1.logger.info(`Utility record created for room ${room.roomNumber}`, {
        utilityId: utility.id,
        recordMonth: startOfMonth.toISOString(),
        createdBy: req.user?.userId,
    });
    res.status(201).json({
        success: true,
        message: 'Utility record created successfully',
        data: { utility },
    });
});
/**
 * Update Utility Record
 *
 * @route   PUT /api/utilities/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: various utility fields)
 * @param res - Express response
 */
exports.updateUtility = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const existingUtility = await prisma.roomUtility.findUnique({
        where: { id },
    });
    if (!existingUtility || existingUtility.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Utility record not found',
        });
        return;
    }
    // Recalculate if readings changed
    if (updateData.waterCurrentReading || updateData.waterPreviousReading) {
        const waterUsage = updateData.waterCurrentReading && updateData.waterPreviousReading
            ? parseFloat(updateData.waterCurrentReading) - parseFloat(updateData.waterPreviousReading)
            : existingUtility.waterUsage;
        updateData.waterUsage = waterUsage;
        updateData.waterCost = (waterUsage || 0) * (updateData.waterRate || existingUtility.waterRate);
    }
    if (updateData.electricityCurrentReading || updateData.electricityPreviousReading) {
        const electricityUsage = updateData.electricityCurrentReading && updateData.electricityPreviousReading
            ? parseFloat(updateData.electricityCurrentReading) -
                parseFloat(updateData.electricityPreviousReading)
            : existingUtility.electricityUsage;
        updateData.electricityUsage = electricityUsage;
        updateData.electricityCost =
            (electricityUsage || 0) * (updateData.electricityRate || existingUtility.electricityRate);
    }
    const utility = await prisma.roomUtility.update({
        where: { id },
        data: updateData,
        include: {
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                },
            },
        },
    });
    logger_1.logger.info(`Utility record updated: ${id}`, {
        utilityId: id,
        updatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Utility record updated successfully',
        data: { utility },
    });
});
/**
 * Delete Utility Record (Soft Delete)
 *
 * @route   DELETE /api/utilities/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deleteUtility = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existingUtility = await prisma.roomUtility.findUnique({
        where: { id },
    });
    if (!existingUtility || existingUtility.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Utility record not found',
        });
        return;
    }
    await prisma.roomUtility.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
    });
    logger_1.logger.info(`Utility record deleted: ${id}`, {
        utilityId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Utility record deleted successfully',
    });
});
//# sourceMappingURL=utility.controller.js.map
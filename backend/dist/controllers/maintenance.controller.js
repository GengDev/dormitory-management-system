"use strict";
/**
 * Maintenance Controller
 *
 * Controller functions สำหรับ maintenance request operations
 *
 * @module server/src/controllers/maintenance.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaintenanceRequest = exports.updateMaintenanceRequest = exports.createMaintenanceRequest = exports.getMaintenanceRequestById = exports.getMaintenanceRequests = void 0;
const client_1 = require("@prisma/client");
const queue_1 = require("../jobs/queue");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get All Maintenance Requests
 *
 * @route   GET /api/maintenance
 * @access  Private (Admin: all, Tenant: own)
 *
 * @param req - Express request (query: tenantId, roomId, status, priority, page, limit)
 * @param res - Express response
 */
exports.getMaintenanceRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenantId, roomId, status, priority, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        deletedAt: null,
    };
    // Tenant can only see own requests
    if (req.user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
            where: {
                userId: req.user.userId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (tenant) {
            where.tenantId = tenant.id;
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
    else {
        // Admin can filter
        if (tenantId)
            where.tenantId = tenantId;
    }
    if (roomId)
        where.roomId = roomId;
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    const [requests, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({
            where,
            include: {
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
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
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.maintenanceRequest.count({ where }),
    ]);
    res.json({
        success: true,
        data: requests,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Maintenance Request By ID
 *
 * @route   GET /api/maintenance/:id
 * @access  Private (Admin or own request)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getMaintenanceRequestById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const request = await prisma.maintenanceRequest.findUnique({
        where: { id },
        include: {
            tenant: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                },
            },
            room: {
                include: {
                    building: true,
                },
            },
            assignedBy: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
    if (!request || request.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Maintenance request not found',
        });
        return;
    }
    // Check authorization
    if (req.user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
            where: {
                userId: req.user.userId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (!tenant || tenant.id !== request.tenantId) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
            return;
        }
    }
    res.json({
        success: true,
        data: { request },
    });
});
/**
 * Create Maintenance Request
 *
 * @route   POST /api/maintenance
 * @access  Private
 *
 * @param req - Express request (body: tenantId, roomId, title, description, ...)
 * @param res - Express response
 */
exports.createMaintenanceRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenantId, roomId, title, description, priority = 'medium', images = [] } = req.body;
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });
    if (!tenant || tenant.deletedAt || tenant.status !== 'active') {
        res.status(404).json({
            success: false,
            message: 'Tenant not found or inactive',
        });
        return;
    }
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
    // Check authorization: Tenant can only create own requests
    if (req.user?.role === 'tenant') {
        if (tenant.userId !== req.user.userId) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
            return;
        }
    }
    const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: {
            tenantId,
            roomId,
            title,
            description,
            category: (req.body.category || client_1.MaintenanceCategory.other),
            priority: priority,
            images: Array.isArray(images) ? images : [],
        },
        include: {
            tenant: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                },
            },
        },
    });
    logger_1.logger.info(`Maintenance request created: ${maintenanceRequest.title}`, {
        requestId: maintenanceRequest.id,
        tenantId,
        createdBy: req.user?.userId,
    });
    res.status(201).json({
        success: true,
        message: 'Maintenance request created successfully',
        data: { request: maintenanceRequest },
    });
});
/**
 * Update Maintenance Request
 *
 * @route   PUT /api/maintenance/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: status, assignedTo, notes, cost)
 * @param res - Express response
 */
exports.updateMaintenanceRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, assignedTo, notes, cost } = req.body;
    const existingRequest = await prisma.maintenanceRequest.findUnique({
        where: { id },
    });
    if (!existingRequest || existingRequest.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Maintenance request not found',
        });
        return;
    }
    const updateData = {};
    if (status)
        updateData.status = status;
    if (assignedTo) {
        updateData.assignedTo = assignedTo;
        updateData.assignedById = req.user?.userId; // Track who assigned it
    }
    if (notes !== undefined)
        updateData.notes = notes;
    if (cost !== undefined)
        updateData.actualCost = parseFloat(cost);
    if (status === 'completed')
        updateData.completedDate = new Date();
    const request = await prisma.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
            tenant: {
                include: {
                    lineUser: true,
                },
            },
            assignedBy: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
    });
    // Send notification if status changed and tenant has LINE account
    if (status && status !== existingRequest.status) {
        try {
            await queue_1.notificationQueue.add('send-line-notification', {
                tenantId: request.tenantId,
                requestId: request.id,
                title: 'อัพเดทการแจ้งซ่อม',
                status: request.status,
                notificationType: client_1.NotificationType.maintenance_updated
            });
            logger_1.logger.info(`Queued maintenance notification for request ${id}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to queue maintenance notification', { error, requestId: id });
        }
    }
    logger_1.logger.info(`Maintenance request updated: ${request.title}`, {
        requestId: id,
        updatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Maintenance request updated successfully',
        data: { request },
    });
});
/**
 * Delete Maintenance Request (Soft Delete)
 *
 * @route   DELETE /api/maintenance/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deleteMaintenanceRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existingRequest = await prisma.maintenanceRequest.findUnique({
        where: { id },
    });
    if (!existingRequest || existingRequest.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Maintenance request not found',
        });
        return;
    }
    await prisma.maintenanceRequest.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
    });
    logger_1.logger.info(`Maintenance request deleted: ${existingRequest.title}`, {
        requestId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Maintenance request deleted successfully',
    });
});
//# sourceMappingURL=maintenance.controller.js.map
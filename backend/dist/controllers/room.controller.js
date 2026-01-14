"use strict";
/**
 * Room Controller
 *
 * Controller functions สำหรับ room management operations
 *
 * @module server/src/controllers/room.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoom = exports.updateRoom = exports.createRoom = exports.getRoomById = exports.getAvailableRooms = exports.getRooms = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get All Rooms
 *
 * @route   GET /api/rooms
 * @access  Public (filtered for non-admin)
 *
 * @param req - Express request (query: buildingId, status, available, minRent, maxRent, page, limit)
 * @param res - Express response
 */
exports.getRooms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { buildingId, status, available, minRent, maxRent, page = '1', limit = '20', } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Build where clause
    const where = {
        deletedAt: null,
    };
    if (buildingId) {
        where.buildingId = buildingId;
    }
    // Non-admin users can only see available rooms
    if (req.user?.role !== 'admin') {
        where.status = 'available';
    }
    else if (status) {
        where.status = status;
    }
    else if (available === 'true') {
        where.status = 'available';
    }
    if (minRent) {
        where.monthlyRent = { ...where.monthlyRent, gte: parseFloat(minRent) };
    }
    if (maxRent) {
        where.monthlyRent = { ...where.monthlyRent, lte: parseFloat(maxRent) };
    }
    const [rooms, total] = await Promise.all([
        prisma.room.findMany({
            where,
            include: {
                building: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
                tenants: {
                    where: {
                        status: 'active',
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: [
                { building: { name: 'asc' } },
                { floorNumber: 'asc' },
                { roomNumber: 'asc' },
            ],
        }),
        prisma.room.count({ where }),
    ]);
    res.json({
        success: true,
        data: rooms,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Available Rooms (Public)
 *
 * @route   GET /api/rooms/available
 * @access  Public
 *
 * @param req - Express request (query: buildingId, minRent, maxRent, page, limit)
 * @param res - Express response
 */
exports.getAvailableRooms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { buildingId, minRent, maxRent, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        deletedAt: null,
        status: 'available',
        building: {
            deletedAt: null,
        },
    };
    if (buildingId) {
        where.buildingId = buildingId;
    }
    if (minRent) {
        where.monthlyRent = { ...where.monthlyRent, gte: parseFloat(minRent) };
    }
    if (maxRent) {
        where.monthlyRent = { ...where.monthlyRent, lte: parseFloat(maxRent) };
    }
    const [rooms, total] = await Promise.all([
        prisma.room.findMany({
            where,
            select: {
                id: true,
                roomNumber: true,
                floorNumber: true,
                roomType: true,
                monthlyRent: true,
                deposit: true,
                areaSqm: true,
                maxOccupancy: true,
                description: true,
                amenities: true,
                images: true,
                building: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: [
                { building: { name: 'asc' } },
                { monthlyRent: 'asc' },
            ],
        }),
        prisma.room.count({ where }),
    ]);
    res.json({
        success: true,
        data: rooms,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Room By ID
 *
 * @route   GET /api/rooms/:id
 * @access  Public
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getRoomById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
        where: { id },
        include: {
            building: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                },
            },
            tenants: {
                where: {
                    status: 'active',
                    deletedAt: null,
                },
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                    contractStartDate: true,
                    contractEndDate: true,
                },
            },
        },
    });
    if (!room || room.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Room not found',
        });
        return;
    }
    // Non-admin users can only see available rooms
    if (req.user?.role !== 'admin' && room.status !== 'available') {
        res.status(404).json({
            success: false,
            message: 'Room not found',
        });
        return;
    }
    res.json({
        success: true,
        data: { room },
    });
});
/**
 * Create Room
 *
 * @route   POST /api/rooms
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: buildingId, roomNumber, floorNumber, monthlyRent, ...)
 * @param res - Express response
 */
exports.createRoom = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { buildingId, roomNumber, floorNumber, roomType, monthlyRent, deposit = 0, areaSqm, maxOccupancy = 1, description, amenities = [], images = [], } = req.body;
    // Check if building exists
    const building = await prisma.building.findUnique({
        where: { id: buildingId },
    });
    if (!building || building.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Building not found',
        });
        return;
    }
    // Check if room number already exists in this building
    const existingRoom = await prisma.room.findFirst({
        where: {
            buildingId,
            roomNumber,
            deletedAt: null,
        },
    });
    if (existingRoom) {
        res.status(400).json({
            success: false,
            message: 'Room number already exists in this building',
        });
        return;
    }
    const room = await prisma.room.create({
        data: {
            buildingId,
            roomNumber,
            floorNumber,
            roomType,
            monthlyRent: parseFloat(monthlyRent),
            deposit: parseFloat(deposit),
            areaSqm: areaSqm ? parseFloat(areaSqm) : null,
            maxOccupancy: parseInt(maxOccupancy, 10),
            description,
            amenities: Array.isArray(amenities) ? amenities : [],
            images: Array.isArray(images) ? images : [],
        },
        include: {
            building: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    logger_1.logger.info(`Room created: ${room.roomNumber}`, {
        roomId: room.id,
        buildingId,
        createdBy: req.user?.userId,
    });
    res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: { room },
    });
});
/**
 * Update Room
 *
 * @route   PUT /api/rooms/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: various room fields)
 * @param res - Express response
 */
exports.updateRoom = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
        where: { id },
    });
    if (!existingRoom || existingRoom.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Room not found',
        });
        return;
    }
    // Convert numeric fields
    if (updateData.monthlyRent)
        updateData.monthlyRent = parseFloat(updateData.monthlyRent);
    if (updateData.deposit)
        updateData.deposit = parseFloat(updateData.deposit);
    if (updateData.areaSqm)
        updateData.areaSqm = parseFloat(updateData.areaSqm);
    if (updateData.maxOccupancy)
        updateData.maxOccupancy = parseInt(updateData.maxOccupancy, 10);
    if (updateData.floorNumber)
        updateData.floorNumber = parseInt(updateData.floorNumber, 10);
    const room = await prisma.room.update({
        where: { id },
        data: updateData,
        include: {
            building: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    logger_1.logger.info(`Room updated: ${room.roomNumber}`, {
        roomId: id,
        updatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Room updated successfully',
        data: { room },
    });
});
/**
 * Delete Room (Soft Delete)
 *
 * @route   DELETE /api/rooms/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deleteRoom = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
        where: { id },
        include: {
            tenants: {
                where: {
                    status: 'active',
                    deletedAt: null,
                },
            },
        },
    });
    if (!existingRoom || existingRoom.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Room not found',
        });
        return;
    }
    // Check if room has active tenants
    if (existingRoom.tenants.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Cannot delete room with active tenants',
        });
        return;
    }
    // Soft delete
    await prisma.room.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: 'maintenance',
        },
    });
    logger_1.logger.info(`Room deleted: ${existingRoom.roomNumber}`, {
        roomId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Room deleted successfully',
    });
});
//# sourceMappingURL=room.controller.js.map
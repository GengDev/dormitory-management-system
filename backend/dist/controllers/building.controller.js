"use strict";
/**
 * Building Controller
 *
 * Controller functions สำหรับ building management operations
 *
 * @module server/src/controllers/building.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBuilding = exports.updateBuilding = exports.createBuilding = exports.getBuildingById = exports.getBuildings = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get All Buildings
 *
 * @route   GET /api/buildings
 * @access  Public
 *
 * @param req - Express request (query: isActive, page, limit)
 * @param res - Express response
 */
exports.getBuildings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Build where clause
    const where = {
        deletedAt: null,
    };
    // All users can see all buildings (no isActive filter)
    const [buildings, total] = await Promise.all([
        prisma.building.findMany({
            where,
            include: {
                _count: {
                    select: {
                        rooms: {
                            where: { deletedAt: null },
                        },
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: { name: 'asc' },
        }),
        prisma.building.count({ where }),
    ]);
    res.json({
        success: true,
        data: buildings,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Building By ID
 *
 * @route   GET /api/buildings/:id
 * @access  Public
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getBuildingById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const building = await prisma.building.findUnique({
        where: { id },
        include: {
            rooms: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    roomNumber: true,
                    floorNumber: true,
                    status: true,
                    monthlyRent: true,
                },
            },
            _count: {
                select: {
                    rooms: {
                        where: { deletedAt: null },
                    },
                },
            },
        },
    });
    if (!building || building.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Building not found',
        });
        return;
    }
    res.json({
        success: true,
        data: { building },
    });
});
/**
 * Create Building
 *
 * @route   POST /api/buildings
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: name, address?, totalFloors?)
 * @param res - Express response
 */
exports.createBuilding = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, address, totalFloors = 1 } = req.body;
    const building = await prisma.building.create({
        data: {
            name,
            address,
            totalFloors,
        },
    });
    logger_1.logger.info(`Building created: ${building.name}`, {
        buildingId: building.id,
        createdBy: req.user?.userId,
    });
    res.status(201).json({
        success: true,
        message: 'Building created successfully',
        data: { building },
    });
});
/**
 * Update Building
 *
 * @route   PUT /api/buildings/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: name?, address?, totalFloors?, isActive?)
 * @param res - Express response
 */
exports.updateBuilding = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, address, totalFloors } = req.body;
    // Check if building exists
    const existingBuilding = await prisma.building.findUnique({
        where: { id },
    });
    if (!existingBuilding || existingBuilding.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Building not found',
        });
        return;
    }
    // Build update data
    const updateData = {};
    if (name)
        updateData.name = name;
    if (address !== undefined)
        updateData.address = address;
    if (totalFloors)
        updateData.totalFloors = totalFloors;
    // Building model doesn't have isActive
    const building = await prisma.building.update({
        where: { id },
        data: updateData,
    });
    logger_1.logger.info(`Building updated: ${building.name}`, {
        buildingId: id,
        updatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Building updated successfully',
        data: { building },
    });
});
/**
 * Delete Building (Soft Delete)
 *
 * @route   DELETE /api/buildings/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deleteBuilding = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if building exists
    const existingBuilding = await prisma.building.findUnique({
        where: { id },
        include: {
            rooms: {
                where: { deletedAt: null },
            },
        },
    });
    if (!existingBuilding || existingBuilding.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Building not found',
        });
        return;
    }
    // Check if building has active rooms
    if (existingBuilding.rooms.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Cannot delete building with active rooms',
        });
        return;
    }
    // Soft delete
    await prisma.building.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    logger_1.logger.info(`Building deleted: ${existingBuilding.name}`, {
        buildingId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Building deleted successfully',
    });
});
//# sourceMappingURL=building.controller.js.map
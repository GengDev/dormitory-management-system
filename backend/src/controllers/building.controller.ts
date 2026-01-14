/**
 * Building Controller
 * 
 * Controller functions สำหรับ building management operations
 * 
 * @module server/src/controllers/building.controller
 */

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get All Buildings
 * 
 * @route   GET /api/buildings
 * @access  Public
 * 
 * @param req - Express request (query: isActive, page, limit)
 * @param res - Express response
 */
export const getBuildings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
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
export const getBuildingById = asyncHandler(async (req: AuthRequest, res: Response) => {
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
export const createBuilding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, address, totalFloors = 1 } = req.body;

  const building = await prisma.building.create({
    data: {
      name,
      address,
      totalFloors,
    },
  });

  logger.info(`Building created: ${building.name}`, {
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
export const updateBuilding = asyncHandler(async (req: AuthRequest, res: Response) => {
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
  const updateData: any = {};
  if (name) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (totalFloors) updateData.totalFloors = totalFloors;
  // Building model doesn't have isActive

  const building = await prisma.building.update({
    where: { id },
    data: updateData,
  });

  logger.info(`Building updated: ${building.name}`, {
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
export const deleteBuilding = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  logger.info(`Building deleted: ${existingBuilding.name}`, {
    buildingId: id,
    deletedBy: req.user?.userId,
  });

  res.json({
    success: true,
    message: 'Building deleted successfully',
  });
});


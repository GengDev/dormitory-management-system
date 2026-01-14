/**
 * User Controller
 * 
 * Controller functions สำหรับ user management operations
 * 
 * @module server/src/controllers/user.controller
 */

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get All Users
 * 
 * @route   GET /api/users
 * @access  Private (Admin only)
 * 
 * @param req - Express request (query: page, limit, role, isActive, search)
 * @param res - Express response
 */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = '20',
    role,
    isActive,
    search,
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
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
      { email: { contains: search as string, mode: 'insensitive' } },
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string, mode: 'insensitive' } },
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
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
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
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
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
  const updateData: any = {};
  if (fullName) updateData.fullName = fullName;
  if (phone) updateData.phone = phone;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

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

  logger.info(`User updated: ${user.email}`, {
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
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  logger.info(`User deleted: ${existingUser.email}`, {
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
export const activateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  logger.info(`User activated: ${user.email}`, {
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
export const deactivateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  logger.info(`User deactivated: ${user.email}`, {
    userId: id,
    deactivatedBy: req.user?.userId,
  });

  res.json({
    success: true,
    message: 'User deactivated successfully',
    data: { user },
  });
});


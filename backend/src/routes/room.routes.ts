/**
 * Room Routes
 * 
 * Routes สำหรับจัดการ rooms (ห้องพัก)
 * 
 * @module server/src/routes/room.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
} from '../controllers/room.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms
 * @access  Public (filtered by status for non-admin)
 * @query   buildingId, status, available, minRent, maxRent, page, limit
 */
router.get('/', optionalAuth, getRooms);

/**
 * @route   GET /api/rooms/available
 * @desc    Get available rooms (for public booking page)
 * @access  Public
 * @query   buildingId, minRent, maxRent, page, limit
 */
router.get('/available', getAvailableRooms);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get room by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, getRoomById);

/**
 * @route   POST /api/rooms
 * @desc    Create room
 * @access  Private (Admin only)
 * @body    { buildingId, roomNumber, floorNumber, monthlyRent, ... }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('buildingId').isUUID().withMessage('Building ID must be a valid UUID'),
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('floorNumber').isInt({ min: 1 }).withMessage('Floor number must be a positive integer'),
    body('monthlyRent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
    body('deposit').optional().isFloat({ min: 0 }),
    body('maxOccupancy').optional().isInt({ min: 1 }),
  ],
  validateRequest,
  createRoom
);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateRequest,
  updateRoom
);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Soft delete room
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteRoom);

export default router;


/**
 * Utility Routes
 * 
 * Routes สำหรับจัดการ room utilities (ค่าน้ำค่าไฟ)
 * 
 * @module server/src/routes/utility.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUtilities,
  getUtilityById,
  createUtility,
  updateUtility,
  deleteUtility,
} from '../controllers/utility.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router: Router = Router();

/**
 * @route   GET /api/utilities
 * @desc    Get all utilities records (Admin: all, Tenant: own room)
 * @access  Private
 * @query   roomId, recordMonth, page, limit
 */
router.get('/', authenticate, getUtilities);

/**
 * @route   GET /api/utilities/:id
 * @desc    Get utility record by ID
 * @access  Private
 */
router.get('/:id', authenticate, getUtilityById);

/**
 * @route   POST /api/utilities
 * @desc    Create utility record
 * @access  Private (Admin only)
 * @body    { roomId, recordMonth, waterPreviousReading, waterCurrentReading, ... }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    body('recordMonth').isISO8601().withMessage('Record month is required'),
    body('waterRate').isFloat({ min: 0 }).withMessage('Water rate must be a positive number'),
    body('electricityRate').isFloat({ min: 0 }).withMessage('Electricity rate must be a positive number'),
  ],
  validateRequest,
  createUtility
);

/**
 * @route   PUT /api/utilities/:id
 * @desc    Update utility record
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), validateRequest, updateUtility);

/**
 * @route   DELETE /api/utilities/:id
 * @desc    Soft delete utility record
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteUtility);

export default router;


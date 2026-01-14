/**
 * Building Routes
 * 
 * Routes สำหรับจัดการ buildings (อาคารหอพัก)
 * 
 * @module server/src/routes/building.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from '../controllers/building.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   GET /api/buildings
 * @desc    Get all buildings
 * @access  Public (but filtered by isActive for non-admin)
 * @query   isActive, page, limit
 */
router.get('/', getBuildings);

/**
 * @route   GET /api/buildings/:id
 * @desc    Get building by ID
 * @access  Public
 */
router.get('/:id', getBuildingById);

/**
 * @route   POST /api/buildings
 * @desc    Create building
 * @access  Private (Admin only)
 * @body    { name, address?, totalFloors? }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Building name is required'),
    body('address').optional().trim(),
    body('totalFloors').optional().isInt({ min: 1 }).withMessage('Total floors must be a positive integer'),
  ],
  validateRequest,
  createBuilding
);

/**
 * @route   PUT /api/buildings/:id
 * @desc    Update building
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim(),
    body('totalFloors').optional().isInt({ min: 1 }),
  ],
  validateRequest,
  updateBuilding
);

/**
 * @route   DELETE /api/buildings/:id
 * @desc    Soft delete building
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteBuilding);

export default router;


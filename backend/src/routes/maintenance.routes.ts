/**
 * Maintenance Routes
 * 
 * Routes สำหรับจัดการ maintenance requests (แจ้งซ่อม)
 * 
 * @module server/src/routes/maintenance.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   GET /api/maintenance
 * @desc    Get all maintenance requests (Admin: all, Tenant: own)
 * @access  Private
 * @query   tenantId, roomId, status, priority, page, limit
 */
router.get('/', authenticate, getMaintenanceRequests);

/**
 * @route   GET /api/maintenance/:id
 * @desc    Get maintenance request by ID
 * @access  Private (Admin or own request)
 */
router.get('/:id', authenticate, getMaintenanceRequestById);

/**
 * @route   POST /api/maintenance
 * @desc    Create maintenance request
 * @access  Private
 * @body    { tenantId, roomId, title, description, priority?, images? }
 */
router.post(
  '/',
  authenticate,
  [
    body('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    body('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validateRequest,
  createMaintenanceRequest
);

/**
 * @route   PUT /api/maintenance/:id
 * @route   PATCH /api/maintenance/:id
 * @desc    Update maintenance request (Admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateRequest,
  updateMaintenanceRequest
);

router.patch(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateRequest,
  updateMaintenanceRequest
);

/**
 * @route   DELETE /api/maintenance/:id
 * @desc    Soft delete maintenance request
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteMaintenanceRequest);

export default router;


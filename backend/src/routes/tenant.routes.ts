/**
 * Tenant Routes
 * 
 * Routes สำหรับจัดการ tenants (ผู้เช่า)
 * 
 * @module server/src/routes/tenant.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  linkLineUser,
  resetTenantPassword,
} from '../controllers/tenant.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants
 * @access  Private (Admin only)
 * @query   roomId, isActive, search, page, limit
 */
router.get('/', authenticate, authorize(['admin']), getTenants);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get tenant by ID
 * @access  Private (Admin or own tenant)
 */
router.get('/:id', authenticate, getTenantById);

/**
 * @route   POST /api/tenants
 * @desc    Create tenant
 * @access  Private (Admin only)
 * @body    { userId?, lineUserId?, roomId, fullName, phone, ... }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('contractStartDate').isISO8601().withMessage('Contract start date is required'),
    body('contractEndDate').optional().isISO8601(),
  ],
  validateRequest,
  createTenant
);

/**
 * @route   PUT /api/tenants/:id
 * @desc    Update tenant
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateRequest,
  updateTenant
);

/**
 * @route   DELETE /api/tenants/:id
 * @desc    Soft delete tenant
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteTenant);

/**
 * @route   POST /api/tenants/:id/link-line
 * @desc    Link LINE user to tenant
 * @access  Private (Admin only)
 * @body    { lineUserId }
 */
router.post(
  '/:id/link-line',
  authenticate,
  authorize(['admin']),
  [body('lineUserId').trim().notEmpty().withMessage('LINE User ID is required')],
  validateRequest,
  linkLineUser
);

/**
 * @route   PATCH /api/tenants/:id/reset-password
 * @desc    Reset tenant password (Admin only)
 * @access  Private (Admin only)
 */
router.patch('/:id/reset-password', authenticate, authorize(['admin']), resetTenantPassword);

export default router;


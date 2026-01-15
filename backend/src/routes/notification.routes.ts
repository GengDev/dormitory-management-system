/**
 * Notification Routes
 *
 * Routes สำหรับจัดการ notifications และส่งแจ้งเตือน
 *
 * @module server/src/routes/notification.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getNotifications,
  createNotification,
  sendBillNotification,
  sendMaintenanceNotification,
  sendCustomNotification,
} from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router: Router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications (Admin: all, Tenant: own)
 * @access  Private
 * @query   tenantId, type, status, page, limit
 */
router.get('/', authenticate, getNotifications);

/**
 * @route   POST /api/notifications
 * @desc    Create notification (internal use)
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize(['admin']), validateRequest, createNotification);

/**
 * @route   POST /api/notifications/send-bill
 * @desc    Send bill notification to tenant
 * @access  Private (Admin only)
 * @body    { billId, tenantId }
 */
router.post(
  '/send-bill',
  authenticate,
  authorize(['admin']),
  [
    body('billId').isUUID().withMessage('Bill ID must be a valid UUID'),
    body('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
  ],
  validateRequest,
  sendBillNotification
);

/**
 * @route   POST /api/notifications/send-maintenance
 * @desc    Send maintenance update notification
 * @access  Private (Admin only)
 * @body    { maintenanceId, tenantId, message }
 */
router.post(
  '/send-maintenance',
  authenticate,
  authorize(['admin']),
  [
    body('maintenanceId').isUUID().withMessage('Maintenance ID must be a valid UUID'),
    body('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validateRequest,
  sendMaintenanceNotification
);

/**
 * @route   POST /api/notifications/send-custom
 * @desc    Send custom notification
 * @access  Private (Admin only)
 * @body    { tenantId, title, message, type }
 */
router.post(
  '/send-custom',
  authenticate,
  authorize(['admin']),
  [
    body('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  ],
  validateRequest,
  sendCustomNotification
);

export default router;


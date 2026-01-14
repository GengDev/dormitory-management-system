/**
 * Bill Routes
 * 
 * Routes สำหรับจัดการ bills (บิลค่าเช่าและค่าสาธารณูปโภค)
 * 
 * @module server/src/routes/bill.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getBills,
  getBillById,
  createBill,
  updateBillStatus,
  getOverdueBills,
  generateMonthlyBills,
} from '../controllers/bill.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   GET /api/bills
 * @desc    Get all bills (Admin: all, Tenant: own bills)
 * @access  Private
 * @query   tenantId, roomId, status, billingMonth, overdue, page, limit
 */
router.get('/', authenticate, getBills);

/**
 * @route   GET /api/bills/overdue
 * @desc    Get overdue bills
 * @access  Private (Admin only)
 */
router.get('/overdue', authenticate, authorize(['admin']), getOverdueBills);

/**
 * @route   GET /api/bills/:id
 * @desc    Get bill by ID with items
 * @access  Private (Admin or own bill)
 */
router.get('/:id', authenticate, getBillById);

/**
 * @route   POST /api/bills
 * @desc    Create bill with items (Transaction)
 * @access  Private (Admin only)
 * @body    { tenantId, roomId, billingMonth, dueDate, items[], notes? }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  [
    body('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    body('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    body('billingMonth').isISO8601().withMessage('Billing month is required'),
    body('dueDate').isISO8601().withMessage('Due date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one bill item is required'),
    body('items.*.itemType').notEmpty().withMessage('Item type is required'),
    body('items.*.description').notEmpty().withMessage('Description is required'),
    body('items.*.quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  ],
  validateRequest,
  createBill
);

/**
 * @route   PUT /api/bills/:id/status
 * @desc    Update bill status
 * @access  Private (Admin only)
 * @body    { status }
 */
router.put(
  '/:id/status',
  authenticate,
  authorize(['admin']),
  [body('status').isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status')],
  validateRequest,
  updateBillStatus
);

/**
 * @route   POST /api/bills/bulk
 * @desc    Alias for generate-monthly (Legacy/Dashboard support)
 */
router.post(
  '/bulk',
  authenticate,
  authorize(['admin']),
  [
    body('billingMonth').exists().withMessage('Billing month is required'),
    body('billingYear').exists().withMessage('Billing year is required'),
  ],
  validateRequest,
  generateMonthlyBills
);

/**
 * @route   POST /api/bills/generate-monthly
 * @desc    Generate monthly bills for all active tenants
 * @access  Private (Admin only)
 * @body    { billingMonth, dueDate }
 */
router.post(
  '/generate-monthly',
  authenticate,
  authorize(['admin']),
  [
    body('billingMonth').isISO8601().withMessage('Billing month is required'),
    body('dueDate').isISO8601().withMessage('Due date is required'),
  ],
  validateRequest,
  generateMonthlyBills
);

export default router;


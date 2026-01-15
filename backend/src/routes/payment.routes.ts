/**
 * Payment Routes
 * 
 * Routes สำหรับจัดการ payments (การชำระเงิน)
 * 
 * @module server/src/routes/payment.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPayments,
  getPaymentById,
  createPayment,
  deletePayment,
  submitTenantPayment,
  approvePayment,
  rejectPayment,
} from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router: Router = Router();

/**
 * @route   GET /api/payments
 * @desc    Get all payments (Admin: all, Tenant: own payments)
 * @access  Private
 * @query   billId, tenantId, paymentDate, page, limit
 */
router.get('/', authenticate, getPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Admin or own payment)
 */
router.get('/:id', authenticate, getPaymentById);

/**
 * @route   POST /api/payments
 * @desc    Record/Submit payment (Admin/Tenant)
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'tenant']),
  [
    body('billId').isUUID().withMessage('Bill ID must be a valid UUID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('paymentMethod').isIn(['cash', 'bank_transfer', 'line_pay', 'promptpay']).withMessage('Invalid payment method'),
    body('paymentDate').isISO8601().withMessage('Payment date is required'),
  ],
  validateRequest,
  (req: any, res: any, next: any) => {
    // Delegate based on user role
    if (req.user?.role === 'admin') {
      return createPayment(req, res, next);
    } else {
      return submitTenantPayment(req, res, next);
    }
  }
);

/**
 * @route   DELETE /api/payments/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deletePayment);

/**
 * @route   PATCH/PUT /api/payments/:id/approve
 * @desc    Approve payment
 * @access  Private (Admin only)
 */
router.patch('/:id/approve', authenticate, authorize(['admin']), approvePayment);
router.put('/:id/approve', authenticate, authorize(['admin']), approvePayment);

/**
 * @route   PATCH/PUT /api/payments/:id/reject
 * @desc    Reject payment
 * @access  Private (Admin only)
 */
router.patch('/:id/reject', authenticate, authorize(['admin']), rejectPayment);
router.put('/:id/reject', authenticate, authorize(['admin']), rejectPayment);

export default router;


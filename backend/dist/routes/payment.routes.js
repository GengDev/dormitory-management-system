"use strict";
/**
 * Payment Routes
 *
 * Routes สำหรับจัดการ payments (การชำระเงิน)
 *
 * @module server/src/routes/payment.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/payments
 * @desc    Get all payments (Admin: all, Tenant: own payments)
 * @access  Private
 * @query   billId, tenantId, paymentDate, page, limit
 */
router.get('/', auth_middleware_1.authenticate, payment_controller_1.getPayments);
/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Admin or own payment)
 */
router.get('/:id', auth_middleware_1.authenticate, payment_controller_1.getPaymentById);
/**
 * @route   POST /api/payments
 * @desc    Record/Submit payment (Admin/Tenant)
 * @access  Private
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin', 'tenant']), [
    (0, express_validator_1.body)('billId').isUUID().withMessage('Bill ID must be a valid UUID'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    (0, express_validator_1.body)('paymentMethod').isIn(['cash', 'bank_transfer', 'line_pay', 'promptpay']).withMessage('Invalid payment method'),
    (0, express_validator_1.body)('paymentDate').isISO8601().withMessage('Payment date is required'),
], validate_middleware_1.validateRequest, (req, res, next) => {
    // Delegate based on user role
    if (req.user?.role === 'admin') {
        return (0, payment_controller_1.createPayment)(req, res, next);
    }
    else {
        return (0, payment_controller_1.submitTenantPayment)(req, res, next);
    }
});
/**
 * @route   DELETE /api/payments/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), payment_controller_1.deletePayment);
/**
 * @route   PATCH/PUT /api/payments/:id/approve
 * @desc    Approve payment
 * @access  Private (Admin only)
 */
router.patch('/:id/approve', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), payment_controller_1.approvePayment);
router.put('/:id/approve', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), payment_controller_1.approvePayment);
/**
 * @route   PATCH/PUT /api/payments/:id/reject
 * @desc    Reject payment
 * @access  Private (Admin only)
 */
router.patch('/:id/reject', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), payment_controller_1.rejectPayment);
router.put('/:id/reject', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), payment_controller_1.rejectPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map
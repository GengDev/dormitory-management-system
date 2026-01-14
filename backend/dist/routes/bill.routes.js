"use strict";
/**
 * Bill Routes
 *
 * Routes สำหรับจัดการ bills (บิลค่าเช่าและค่าสาธารณูปโภค)
 *
 * @module server/src/routes/bill.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bill_controller_1 = require("../controllers/bill.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/bills
 * @desc    Get all bills (Admin: all, Tenant: own bills)
 * @access  Private
 * @query   tenantId, roomId, status, billingMonth, overdue, page, limit
 */
router.get('/', auth_middleware_1.authenticate, bill_controller_1.getBills);
/**
 * @route   GET /api/bills/overdue
 * @desc    Get overdue bills
 * @access  Private (Admin only)
 */
router.get('/overdue', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), bill_controller_1.getOverdueBills);
/**
 * @route   GET /api/bills/:id
 * @desc    Get bill by ID with items
 * @access  Private (Admin or own bill)
 */
router.get('/:id', auth_middleware_1.authenticate, bill_controller_1.getBillById);
/**
 * @route   POST /api/bills
 * @desc    Create bill with items (Transaction)
 * @access  Private (Admin only)
 * @body    { tenantId, roomId, billingMonth, dueDate, items[], notes? }
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    (0, express_validator_1.body)('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    (0, express_validator_1.body)('billingMonth').isISO8601().withMessage('Billing month is required'),
    (0, express_validator_1.body)('dueDate').isISO8601().withMessage('Due date is required'),
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('At least one bill item is required'),
    (0, express_validator_1.body)('items.*.itemType').notEmpty().withMessage('Item type is required'),
    (0, express_validator_1.body)('items.*.description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('items.*.quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    (0, express_validator_1.body)('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
], validate_middleware_1.validateRequest, bill_controller_1.createBill);
/**
 * @route   PUT /api/bills/:id/status
 * @desc    Update bill status
 * @access  Private (Admin only)
 * @body    { status }
 */
router.put('/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [(0, express_validator_1.body)('status').isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status')], validate_middleware_1.validateRequest, bill_controller_1.updateBillStatus);
/**
 * @route   POST /api/bills/bulk
 * @desc    Alias for generate-monthly (Legacy/Dashboard support)
 */
router.post('/bulk', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('billingMonth').exists().withMessage('Billing month is required'),
    (0, express_validator_1.body)('billingYear').exists().withMessage('Billing year is required'),
], validate_middleware_1.validateRequest, bill_controller_1.generateMonthlyBills);
/**
 * @route   POST /api/bills/generate-monthly
 * @desc    Generate monthly bills for all active tenants
 * @access  Private (Admin only)
 * @body    { billingMonth, dueDate }
 */
router.post('/generate-monthly', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('billingMonth').isISO8601().withMessage('Billing month is required'),
    (0, express_validator_1.body)('dueDate').isISO8601().withMessage('Due date is required'),
], validate_middleware_1.validateRequest, bill_controller_1.generateMonthlyBills);
exports.default = router;
//# sourceMappingURL=bill.routes.js.map
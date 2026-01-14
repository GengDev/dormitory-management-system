"use strict";
/**
 * Tenant Routes
 *
 * Routes สำหรับจัดการ tenants (ผู้เช่า)
 *
 * @module server/src/routes/tenant.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const tenant_controller_1 = require("../controllers/tenant.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/tenants
 * @desc    Get all tenants
 * @access  Private (Admin only)
 * @query   roomId, isActive, search, page, limit
 */
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), tenant_controller_1.getTenants);
/**
 * @route   GET /api/tenants/:id
 * @desc    Get tenant by ID
 * @access  Private (Admin or own tenant)
 */
router.get('/:id', auth_middleware_1.authenticate, tenant_controller_1.getTenantById);
/**
 * @route   POST /api/tenants
 * @desc    Create tenant
 * @access  Private (Admin only)
 * @body    { userId?, lineUserId?, roomId, fullName, phone, ... }
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    (0, express_validator_1.body)('fullName').trim().notEmpty().withMessage('Full name is required'),
    (0, express_validator_1.body)('phone').trim().notEmpty().withMessage('Phone is required'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email must be valid'),
    (0, express_validator_1.body)('contractStartDate').isISO8601().withMessage('Contract start date is required'),
    (0, express_validator_1.body)('contractEndDate').optional().isISO8601(),
], validate_middleware_1.validateRequest, tenant_controller_1.createTenant);
/**
 * @route   PUT /api/tenants/:id
 * @desc    Update tenant
 * @access  Private (Admin only)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), validate_middleware_1.validateRequest, tenant_controller_1.updateTenant);
/**
 * @route   DELETE /api/tenants/:id
 * @desc    Soft delete tenant
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), tenant_controller_1.deleteTenant);
/**
 * @route   POST /api/tenants/:id/link-line
 * @desc    Link LINE user to tenant
 * @access  Private (Admin only)
 * @body    { lineUserId }
 */
router.post('/:id/link-line', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [(0, express_validator_1.body)('lineUserId').trim().notEmpty().withMessage('LINE User ID is required')], validate_middleware_1.validateRequest, tenant_controller_1.linkLineUser);
exports.default = router;
//# sourceMappingURL=tenant.routes.js.map
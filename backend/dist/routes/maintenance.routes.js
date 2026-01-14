"use strict";
/**
 * Maintenance Routes
 *
 * Routes สำหรับจัดการ maintenance requests (แจ้งซ่อม)
 *
 * @module server/src/routes/maintenance.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const maintenance_controller_1 = require("../controllers/maintenance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/maintenance
 * @desc    Get all maintenance requests (Admin: all, Tenant: own)
 * @access  Private
 * @query   tenantId, roomId, status, priority, page, limit
 */
router.get('/', auth_middleware_1.authenticate, maintenance_controller_1.getMaintenanceRequests);
/**
 * @route   GET /api/maintenance/:id
 * @desc    Get maintenance request by ID
 * @access  Private (Admin or own request)
 */
router.get('/:id', auth_middleware_1.authenticate, maintenance_controller_1.getMaintenanceRequestById);
/**
 * @route   POST /api/maintenance
 * @desc    Create maintenance request
 * @access  Private
 * @body    { tenantId, roomId, title, description, priority?, images? }
 */
router.post('/', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    (0, express_validator_1.body)('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    (0, express_validator_1.body)('title').trim().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('description').trim().notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], validate_middleware_1.validateRequest, maintenance_controller_1.createMaintenanceRequest);
/**
 * @route   PUT /api/maintenance/:id
 * @route   PATCH /api/maintenance/:id
 * @desc    Update maintenance request (Admin only)
 * @access  Private (Admin only)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), validate_middleware_1.validateRequest, maintenance_controller_1.updateMaintenanceRequest);
router.patch('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), validate_middleware_1.validateRequest, maintenance_controller_1.updateMaintenanceRequest);
/**
 * @route   DELETE /api/maintenance/:id
 * @desc    Soft delete maintenance request
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), maintenance_controller_1.deleteMaintenanceRequest);
exports.default = router;
//# sourceMappingURL=maintenance.routes.js.map
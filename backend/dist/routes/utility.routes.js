"use strict";
/**
 * Utility Routes
 *
 * Routes สำหรับจัดการ room utilities (ค่าน้ำค่าไฟ)
 *
 * @module server/src/routes/utility.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const utility_controller_1 = require("../controllers/utility.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/utilities
 * @desc    Get all utilities records (Admin: all, Tenant: own room)
 * @access  Private
 * @query   roomId, recordMonth, page, limit
 */
router.get('/', auth_middleware_1.authenticate, utility_controller_1.getUtilities);
/**
 * @route   GET /api/utilities/:id
 * @desc    Get utility record by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.authenticate, utility_controller_1.getUtilityById);
/**
 * @route   POST /api/utilities
 * @desc    Create utility record
 * @access  Private (Admin only)
 * @body    { roomId, recordMonth, waterPreviousReading, waterCurrentReading, ... }
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
    (0, express_validator_1.body)('recordMonth').isISO8601().withMessage('Record month is required'),
    (0, express_validator_1.body)('waterRate').isFloat({ min: 0 }).withMessage('Water rate must be a positive number'),
    (0, express_validator_1.body)('electricityRate').isFloat({ min: 0 }).withMessage('Electricity rate must be a positive number'),
], validate_middleware_1.validateRequest, utility_controller_1.createUtility);
/**
 * @route   PUT /api/utilities/:id
 * @desc    Update utility record
 * @access  Private (Admin only)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), validate_middleware_1.validateRequest, utility_controller_1.updateUtility);
/**
 * @route   DELETE /api/utilities/:id
 * @desc    Soft delete utility record
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), utility_controller_1.deleteUtility);
exports.default = router;
//# sourceMappingURL=utility.routes.js.map
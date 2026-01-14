"use strict";
/**
 * Building Routes
 *
 * Routes สำหรับจัดการ buildings (อาคารหอพัก)
 *
 * @module server/src/routes/building.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const building_controller_1 = require("../controllers/building.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/buildings
 * @desc    Get all buildings
 * @access  Public (but filtered by isActive for non-admin)
 * @query   isActive, page, limit
 */
router.get('/', building_controller_1.getBuildings);
/**
 * @route   GET /api/buildings/:id
 * @desc    Get building by ID
 * @access  Public
 */
router.get('/:id', building_controller_1.getBuildingById);
/**
 * @route   POST /api/buildings
 * @desc    Create building
 * @access  Private (Admin only)
 * @body    { name, address?, totalFloors? }
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Building name is required'),
    (0, express_validator_1.body)('address').optional().trim(),
    (0, express_validator_1.body)('totalFloors').optional().isInt({ min: 1 }).withMessage('Total floors must be a positive integer'),
], validate_middleware_1.validateRequest, building_controller_1.createBuilding);
/**
 * @route   PUT /api/buildings/:id
 * @desc    Update building
 * @access  Private (Admin only)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('name').optional().trim().notEmpty(),
    (0, express_validator_1.body)('address').optional().trim(),
    (0, express_validator_1.body)('totalFloors').optional().isInt({ min: 1 }),
], validate_middleware_1.validateRequest, building_controller_1.updateBuilding);
/**
 * @route   DELETE /api/buildings/:id
 * @desc    Soft delete building
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), building_controller_1.deleteBuilding);
exports.default = router;
//# sourceMappingURL=building.routes.js.map
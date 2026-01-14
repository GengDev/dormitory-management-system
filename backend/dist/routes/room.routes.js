"use strict";
/**
 * Room Routes
 *
 * Routes สำหรับจัดการ rooms (ห้องพัก)
 *
 * @module server/src/routes/room.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const room_controller_1 = require("../controllers/room.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/rooms
 * @desc    Get all rooms
 * @access  Public (filtered by status for non-admin)
 * @query   buildingId, status, available, minRent, maxRent, page, limit
 */
router.get('/', auth_middleware_1.optionalAuth, room_controller_1.getRooms);
/**
 * @route   GET /api/rooms/available
 * @desc    Get available rooms (for public booking page)
 * @access  Public
 * @query   buildingId, minRent, maxRent, page, limit
 */
router.get('/available', room_controller_1.getAvailableRooms);
/**
 * @route   GET /api/rooms/:id
 * @desc    Get room by ID
 * @access  Public
 */
router.get('/:id', auth_middleware_1.optionalAuth, room_controller_1.getRoomById);
/**
 * @route   POST /api/rooms
 * @desc    Create room
 * @access  Private (Admin only)
 * @body    { buildingId, roomNumber, floorNumber, monthlyRent, ... }
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('buildingId').isUUID().withMessage('Building ID must be a valid UUID'),
    (0, express_validator_1.body)('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    (0, express_validator_1.body)('floorNumber').isInt({ min: 1 }).withMessage('Floor number must be a positive integer'),
    (0, express_validator_1.body)('monthlyRent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
    (0, express_validator_1.body)('deposit').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('maxOccupancy').optional().isInt({ min: 1 }),
], validate_middleware_1.validateRequest, room_controller_1.createRoom);
/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), validate_middleware_1.validateRequest, room_controller_1.updateRoom);
/**
 * @route   DELETE /api/rooms/:id
 * @desc    Soft delete room
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), room_controller_1.deleteRoom);
exports.default = router;
//# sourceMappingURL=room.routes.js.map
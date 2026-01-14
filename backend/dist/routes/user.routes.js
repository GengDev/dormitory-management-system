"use strict";
/**
 * User Routes
 *
 * Routes สำหรับจัดการ users (Admin only)
 *
 * @module server/src/routes/user.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination)
 * @access  Private (Admin only)
 * @query   page, limit, role, isActive, search
 */
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), user_controller_1.getUsers);
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), user_controller_1.getUserById);
/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), user_controller_1.updateUser);
/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), user_controller_1.deleteUser);
/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin only)
 */
router.patch('/:id/activate', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), user_controller_1.activateUser);
/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin only)
 */
router.patch('/:id/deactivate', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), user_controller_1.deactivateUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map
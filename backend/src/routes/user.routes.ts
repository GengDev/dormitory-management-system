/**
 * User Routes
 * 
 * Routes สำหรับจัดการ users (Admin only)
 * 
 * @module server/src/routes/user.routes
 */

import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router: Router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination)
 * @access  Private (Admin only)
 * @query   page, limit, role, isActive, search
 */
router.get('/', authenticate, authorize(['admin']), getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize(['admin']), getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin only)
 */
router.patch('/:id/activate', authenticate, authorize(['admin']), activateUser);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin only)
 */
router.patch('/:id/deactivate', authenticate, authorize(['admin']), deactivateUser);

export default router;


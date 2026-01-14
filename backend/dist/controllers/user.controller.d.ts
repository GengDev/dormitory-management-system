/**
 * User Controller
 *
 * Controller functions สำหรับ user management operations
 *
 * @module server/src/controllers/user.controller
 */
import { Response } from 'express';
/**
 * Get All Users
 *
 * @route   GET /api/users
 * @access  Private (Admin only)
 *
 * @param req - Express request (query: page, limit, role, isActive, search)
 * @param res - Express response
 */
export declare const getUsers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get User By ID
 *
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getUserById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update User
 *
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: fullName, phone, role, isActive)
 * @param res - Express response
 */
export declare const updateUser: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete User (Soft Delete)
 *
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deleteUser: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Activate User
 *
 * @route   PATCH /api/users/:id/activate
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const activateUser: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Deactivate User
 *
 * @route   PATCH /api/users/:id/deactivate
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deactivateUser: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=user.controller.d.ts.map
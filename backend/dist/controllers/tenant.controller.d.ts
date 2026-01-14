/**
 * Tenant Controller
 *
 * Controller functions สำหรับ tenant management operations
 *
 * @module server/src/controllers/tenant.controller
 */
import { Response } from 'express';
/**
 * Get All Tenants
 *
 * @route   GET /api/tenants
 * @access  Private (Admin only)
 *
 * @param req - Express request (query: roomId, isActive, search, page, limit)
 * @param res - Express response
 */
export declare const getTenants: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Tenant By ID
 *
 * @route   GET /api/tenants/:id
 * @access  Private (Admin or own tenant)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getTenantById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Tenant
 *
 * @route   POST /api/tenants
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: roomId, fullName, phone, ...)
 * @param res - Express response
 */
export declare const createTenant: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update Tenant
 *
 * @route   PUT /api/tenants/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: various tenant fields)
 * @param res - Express response
 */
export declare const updateTenant: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete Tenant (Soft Delete)
 *
 * @route   DELETE /api/tenants/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deleteTenant: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Link LINE User to Tenant
 *
 * @route   POST /api/tenants/:id/link-line
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: lineUserId)
 * @param res - Express response
 */
export declare const linkLineUser: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=tenant.controller.d.ts.map
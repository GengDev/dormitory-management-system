/**
 * Maintenance Controller
 *
 * Controller functions สำหรับ maintenance request operations
 *
 * @module server/src/controllers/maintenance.controller
 */
import { Response } from 'express';
/**
 * Get All Maintenance Requests
 *
 * @route   GET /api/maintenance
 * @access  Private (Admin: all, Tenant: own)
 *
 * @param req - Express request (query: tenantId, roomId, status, priority, page, limit)
 * @param res - Express response
 */
export declare const getMaintenanceRequests: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Maintenance Request By ID
 *
 * @route   GET /api/maintenance/:id
 * @access  Private (Admin or own request)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getMaintenanceRequestById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Maintenance Request
 *
 * @route   POST /api/maintenance
 * @access  Private
 *
 * @param req - Express request (body: tenantId, roomId, title, description, ...)
 * @param res - Express response
 */
export declare const createMaintenanceRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update Maintenance Request
 *
 * @route   PUT /api/maintenance/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: status, assignedTo, notes, cost)
 * @param res - Express response
 */
export declare const updateMaintenanceRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete Maintenance Request (Soft Delete)
 *
 * @route   DELETE /api/maintenance/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deleteMaintenanceRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=maintenance.controller.d.ts.map
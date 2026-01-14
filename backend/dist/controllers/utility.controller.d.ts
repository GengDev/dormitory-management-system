/**
 * Utility Controller
 *
 * Controller functions สำหรับ utility management operations
 *
 * @module server/src/controllers/utility.controller
 */
import { Response } from 'express';
/**
 * Get All Utilities
 *
 * @route   GET /api/utilities
 * @access  Private (Admin: all, Tenant: own room)
 *
 * @param req - Express request (query: roomId, recordMonth, page, limit)
 * @param res - Express response
 */
export declare const getUtilities: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Utility By ID
 *
 * @route   GET /api/utilities/:id
 * @access  Private
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getUtilityById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Utility Record
 *
 * @route   POST /api/utilities
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: roomId, recordMonth, water/electricity readings, rates)
 * @param res - Express response
 */
export declare const createUtility: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update Utility Record
 *
 * @route   PUT /api/utilities/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: various utility fields)
 * @param res - Express response
 */
export declare const updateUtility: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete Utility Record (Soft Delete)
 *
 * @route   DELETE /api/utilities/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deleteUtility: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=utility.controller.d.ts.map
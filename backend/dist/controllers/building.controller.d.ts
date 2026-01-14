/**
 * Building Controller
 *
 * Controller functions สำหรับ building management operations
 *
 * @module server/src/controllers/building.controller
 */
import { Response } from 'express';
/**
 * Get All Buildings
 *
 * @route   GET /api/buildings
 * @access  Public
 *
 * @param req - Express request (query: isActive, page, limit)
 * @param res - Express response
 */
export declare const getBuildings: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Building By ID
 *
 * @route   GET /api/buildings/:id
 * @access  Public
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getBuildingById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Building
 *
 * @route   POST /api/buildings
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: name, address?, totalFloors?)
 * @param res - Express response
 */
export declare const createBuilding: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update Building
 *
 * @route   PUT /api/buildings/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: name?, address?, totalFloors?, isActive?)
 * @param res - Express response
 */
export declare const updateBuilding: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete Building (Soft Delete)
 *
 * @route   DELETE /api/buildings/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deleteBuilding: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=building.controller.d.ts.map
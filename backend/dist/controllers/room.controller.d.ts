/**
 * Room Controller
 *
 * Controller functions สำหรับ room management operations
 *
 * @module server/src/controllers/room.controller
 */
import { Response } from 'express';
/**
 * Get All Rooms
 *
 * @route   GET /api/rooms
 * @access  Public (filtered for non-admin)
 *
 * @param req - Express request (query: buildingId, status, available, minRent, maxRent, page, limit)
 * @param res - Express response
 */
export declare const getRooms: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Available Rooms (Public)
 *
 * @route   GET /api/rooms/available
 * @access  Public
 *
 * @param req - Express request (query: buildingId, minRent, maxRent, page, limit)
 * @param res - Express response
 */
export declare const getAvailableRooms: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Room By ID
 *
 * @route   GET /api/rooms/:id
 * @access  Public
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getRoomById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Room
 *
 * @route   POST /api/rooms
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: buildingId, roomNumber, floorNumber, monthlyRent, ...)
 * @param res - Express response
 */
export declare const createRoom: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update Room
 *
 * @route   PUT /api/rooms/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: various room fields)
 * @param res - Express response
 */
export declare const updateRoom: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete Room (Soft Delete)
 *
 * @route   DELETE /api/rooms/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const deleteRoom: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=room.controller.d.ts.map
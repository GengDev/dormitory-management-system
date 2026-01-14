/**
 * Chat Controller
 *
 * Controller functions สำหรับ chat management operations
 *
 * @module server/src/controllers/chat.controller
 */
import { Response } from 'express';
/**
 * Get Chat Rooms
 *
 * @route   GET /api/chat/rooms
 * @access  Private
 *
 * @param req - Express request (query: roomId, isActive)
 * @param res - Express response
 */
export declare const getChatRooms: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Chat Room By ID
 *
 * @route   GET /api/chat/rooms/:id
 * @access  Private
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getChatRoomById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Chat Room
 *
 * @route   POST /api/chat/rooms
 * @access  Private
 *
 * @param req - Express request (body: roomId?, guestUserId?)
 * @param res - Express response
 */
export declare const createChatRoom: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Chat Messages
 *
 * @route   GET /api/chat/rooms/:id/messages
 * @access  Private
 *
 * @param req - Express request (params: id, query: page, limit, before)
 * @param res - Express response
 */
export declare const getChatMessages: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=chat.controller.d.ts.map
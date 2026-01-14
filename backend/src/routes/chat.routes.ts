/**
 * Chat Routes
 * 
 * Routes สำหรับจัดการ chat rooms และ messages
 * 
 * @module server/src/routes/chat.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getChatRooms,
  getChatRoomById,
  createChatRoom,
  getChatMessages,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   GET /api/chat/rooms
 * @desc    Get user's chat rooms
 * @access  Private
 * @query   roomId, isActive
 */
router.get('/rooms', authenticate, getChatRooms);

/**
 * @route   GET /api/chat/rooms/:id
 * @desc    Get chat room by ID
 * @access  Private
 */
router.get('/rooms/:id', authenticate, getChatRoomById);

/**
 * @route   POST /api/chat/rooms
 * @desc    Create chat room (for guest inquiries)
 * @access  Private
 * @body    { roomId?, guestUserId }
 */
router.post(
  '/rooms',
  authenticate,
  [
    body('roomId').optional().isUUID(),
    body('guestUserId').optional().isUUID(),
  ],
  validateRequest,
  createChatRoom
);

/**
 * @route   GET /api/chat/rooms/:id/messages
 * @desc    Get messages in chat room
 * @access  Private
 * @query   page, limit, before (timestamp for pagination)
 */
router.get('/rooms/:id/messages', authenticate, getChatMessages);

export default router;


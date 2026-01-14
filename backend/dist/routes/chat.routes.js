"use strict";
/**
 * Chat Routes
 *
 * Routes สำหรับจัดการ chat rooms และ messages
 *
 * @module server/src/routes/chat.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/chat/rooms
 * @desc    Get user's chat rooms
 * @access  Private
 * @query   roomId, isActive
 */
router.get('/rooms', auth_middleware_1.authenticate, chat_controller_1.getChatRooms);
/**
 * @route   GET /api/chat/rooms/:id
 * @desc    Get chat room by ID
 * @access  Private
 */
router.get('/rooms/:id', auth_middleware_1.authenticate, chat_controller_1.getChatRoomById);
/**
 * @route   POST /api/chat/rooms
 * @desc    Create chat room (for guest inquiries)
 * @access  Private
 * @body    { roomId?, guestUserId }
 */
router.post('/rooms', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('roomId').optional().isUUID(),
    (0, express_validator_1.body)('guestUserId').optional().isUUID(),
], validate_middleware_1.validateRequest, chat_controller_1.createChatRoom);
/**
 * @route   GET /api/chat/rooms/:id/messages
 * @desc    Get messages in chat room
 * @access  Private
 * @query   page, limit, before (timestamp for pagination)
 */
router.get('/rooms/:id/messages', auth_middleware_1.authenticate, chat_controller_1.getChatMessages);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map
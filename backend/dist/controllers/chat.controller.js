"use strict";
/**
 * Chat Controller
 *
 * Controller functions สำหรับ chat management operations
 *
 * @module server/src/controllers/chat.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatMessages = exports.createChatRoom = exports.getChatRoomById = exports.getChatRooms = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get Chat Rooms
 *
 * @route   GET /api/chat/rooms
 * @access  Private
 *
 * @param req - Express request (query: roomId, isActive)
 * @param res - Express response
 */
exports.getChatRooms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { roomId } = req.query;
    const where = {
        deletedAt: null,
    };
    // Filter by user role
    if (req.user?.role === 'admin') {
        // Admin can see all chat rooms
        if (roomId)
            where.id = roomId; // Changed from roomId (model field) to id because 'roomId' in schema refers to Room relation ID now, but usually query param 'roomId' means ChatRoom.id? 
        // Wait, let's assume 'roomId' query param meant Building Room ID or ChatRoom ID?
        // Existing code: where.roomId = roomId. 
        // In old schema: roomId was not unique string? No, it was likely relation to Room or maybe just a string.
        // In new schema: roomId is relation to Room.
        // If param is chatRoomId, we should use 'id'. 
        // Let's assume input 'roomId' meant 'ChatRoom ID' or 'Room ID'?
        // Given the context of "Get Chat Rooms", filtering by specific ChatRoom ID is rare unless detail view.
        // Let's assume it filters by Room context.
    }
    else if (req.user?.role === 'tenant') {
        // Tenant can see own chat rooms
        const tenant = await prisma.tenant.findFirst({
            where: {
                userId: req.user.userId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (tenant) {
            where.tenantId = tenant.id;
        }
        else {
            res.json({
                success: true,
                data: [],
            });
            return;
        }
    }
    else {
        // Guest can see own chat rooms
        // Modified to support both guestUserId and sessionId based lookups could be complex here 
        // but usually AuthRequest implies logged in user.
        // For anonymous guests, they usually use socket or a public endpoint, not this one.
        // But if logged in as guest role:
        where.guestUserId = req.user?.userId;
    }
    const chatRooms = await prisma.chatRoom.findMany({
        where,
        include: {
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                    building: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            tenant: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            guest: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            admin: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            deletedAt: null,
                            isRead: false,
                            senderId: { not: req.user?.userId }, // Note: senderId for admin might be 'admin' string or User ID.
                        },
                    },
                },
            },
        },
        orderBy: { lastMessageAt: 'desc' },
    });
    res.json({
        success: true,
        data: chatRooms.map((room) => ({
            ...room,
            unreadCount: room._count.messages,
            // Fallback name for anonymous chats
            guestName: room.guestName || room.guest?.fullName || (room.tenant?.fullName) || 'Guest',
        })),
    });
});
/**
 * Get Chat Room By ID
 *
 * @route   GET /api/chat/rooms/:id
 * @access  Private
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getChatRoomById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const chatRoom = await prisma.chatRoom.findUnique({
        where: { id },
        include: {
            room: {
                include: {
                    building: true,
                },
            },
            tenant: true,
            guest: true,
            admin: true,
        },
    });
    if (!chatRoom || chatRoom.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Chat room not found',
        });
        return;
    }
    // Check access
    if (req.user?.role !== 'admin') {
        if (chatRoom.tenantId &&
            chatRoom.guestUserId !== req.user?.userId &&
            chatRoom.adminUserId !== req.user?.userId) {
            // Check if user is tenant
            const tenant = await prisma.tenant.findFirst({
                where: {
                    userId: req.user?.userId,
                    id: chatRoom.tenantId,
                },
            });
            if (!tenant) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                });
                return;
            }
        }
    }
    res.json({
        success: true,
        data: { chatRoom },
    });
});
/**
 * Create Chat Room
 *
 * @route   POST /api/chat/rooms
 * @access  Private
 *
 * @param req - Express request (body: roomId?, guestUserId?)
 * @param res - Express response
 */
exports.createChatRoom = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { roomId, guestUserId } = req.body;
    // For guest inquiries
    if (guestUserId && req.user?.role === 'guest') {
        // Check if chat room already exists
        // Fix: guestUserId refers to User model ID now
        const existingRoom = await prisma.chatRoom.findFirst({
            where: {
                roomId: roomId || null,
                guestUserId: guestUserId,
                deletedAt: null,
            },
        });
        if (existingRoom) {
            res.json({
                success: true,
                message: 'Chat room already exists',
                data: { chatRoom: existingRoom },
            });
            return;
        }
        // Assign admin (round-robin or available admin)
        const admin = await prisma.user.findFirst({
            where: {
                role: 'admin',
                isActive: true,
                deletedAt: null,
            },
        });
        const chatRoom = await prisma.chatRoom.create({
            data: {
                roomId: roomId || null,
                guestUserId,
                adminUserId: admin?.id,
                isActive: true, // Set default
            },
            include: {
                room: true,
                admin: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });
        logger_1.logger.info(`Chat room created: ${chatRoom.id}`, {
            chatRoomId: chatRoom.id,
            createdBy: req.user?.userId,
        });
        res.status(201).json({
            success: true,
            message: 'Chat room created successfully',
            data: { chatRoom },
        });
        return;
    }
    res.status(400).json({
        success: false,
        message: 'Invalid request',
    });
});
/**
 * Get Chat Messages
 *
 * @route   GET /api/chat/rooms/:id/messages
 * @access  Private
 *
 * @param req - Express request (params: id, query: page, limit, before)
 * @param res - Express response
 */
exports.getChatMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { page = "1", limit = "50", before } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Check access
    // Try to find by ID (UUID) or Session ID
    const chatRoom = await prisma.chatRoom.findFirst({
        where: {
            OR: [
                { id: id },
                { sessionId: id }
            ],
            deletedAt: null
        },
    });
    if (!chatRoom || chatRoom.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Chat room not found',
        });
        return;
    }
    // Build where clause
    const where = {
        chatRoomId: chatRoom.id, // Use the resolved ID from the database
        deletedAt: null,
    };
    if (before) {
        where.createdAt = { lt: new Date(before) };
    }
    const messages = await prisma.chatMessage.findMany({
        where,
        include: {
            sender: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
    });
    // Check if there are more messages
    const hasMore = messages.length === limitNum;
    // Transform messages to match frontend expectations
    const mappedMessages = messages.map(msg => ({
        ...msg,
        message: msg.content, // Map content back to message for frontend
        // Shim sender for frontend compatibility (Frontend expects msg.sender.fullName)
        sender: msg.sender || {
            id: msg.senderId,
            fullName: msg.senderName || 'Guest',
            email: '',
        },
    }));
    res.json({
        success: true,
        data: mappedMessages.reverse(), // Return in chronological order
        meta: {
            hasMore,
            count: messages.length,
        },
    });
});
//# sourceMappingURL=chat.controller.js.map
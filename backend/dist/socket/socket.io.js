"use strict";
/**
 * Socket.io Gateway
 *
 * Real-time chat gateway สำหรับ WebSocket connections
 * รองรับ multi-server ด้วย Redis adapter
 *
 * @module server/src/socket/socket.io
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketIO = initializeSocketIO;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Initialize Socket.io
 *
 * @param io - Socket.io server instance
 *
 * @description
 * Setup Socket.io middleware, authentication, และ event handlers
 */
function initializeSocketIO(io) {
    // Public chat namespace (no authentication required)
    const publicChat = io.of('/public-chat');
    publicChat.on('connection', (socket) => {
        logger_1.logger.info('Public chat user connected', { socketId: socket.id });
        socket.on('join_private_chat', async (data) => {
            const { name, roomId, isAdmin = false } = data;
            socket.data.name = name;
            socket.data.roomId = roomId; // This roomId is actually sessionId for guests
            socket.data.isAdmin = isAdmin;
            socket.join(roomId);
            // Create or find chat room
            try {
                if (!isAdmin) {
                    // Check if room exists by sessionId
                    let chatRoom = await prisma.chatRoom.findUnique({
                        where: { sessionId: roomId },
                    });
                    if (!chatRoom) {
                        chatRoom = await prisma.chatRoom.create({
                            data: {
                                sessionId: roomId,
                                guestName: name,
                                isPublic: true,
                                isActive: true,
                                lastMessageAt: new Date(),
                            },
                        });
                        logger_1.logger.info(`Created new public chat room: ${chatRoom.id} (Session: ${roomId})`);
                    }
                    else {
                        logger_1.logger.info(`Joined existing public chat room: ${chatRoom.id} (Session: ${roomId})`);
                    }
                    // Store actual DB id in socket data for later use if needed, 
                    // but for now we use sessionId as the socket room name 
                    // and we query by sessionId when saving messages.
                    if (chatRoom) {
                        // Notify admin about new conversation (using UUID)
                        publicChat.to('admin_room').emit('new_conversation', {
                            roomId: chatRoom.id, // Use UUID
                            userName: name,
                            timestamp: new Date(),
                        });
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Error creating/joining public chat room', { error });
            }
            logger_1.logger.info(`Private chat user joined: ${name} (Room: ${roomId}, Admin: ${isAdmin})`, { socketId: socket.id });
            // Send welcome message only if it's a new session? 
            // Existing logic sends it every time. Let's keep it but maybe check if history exists?
            // For now, keep existing behavior to match UX expectations or maybe only if no messages?
            socket.emit('message', {
                id: Date.now().toString(),
                senderId: 'system',
                senderName: 'ระบบ',
                message: `สวัสดีครับ ${name}! มีอะไรให้ช่วยเหลือไหมครับ?`,
                timestamp: new Date(),
                isAdmin: true,
                roomId: roomId,
            });
            // Notify admin about new conversation (if not admin)
            // Moved to inside try/catch to use UUID
        });
        socket.on('join_admin_room', (data) => {
            const { name, isAdmin = false } = data;
            socket.data.name = name;
            socket.data.isAdmin = isAdmin;
            socket.join('admin_room');
            logger_1.logger.info(`Admin joined admin room: ${name}`, { socketId: socket.id });
        });
        socket.on('send_message', async (data) => {
            const { message, isAdmin } = data;
            // Admin provides roomId in data, Guest provides via socket.data
            const incomingRoomId = isAdmin ? data.roomId : socket.data.roomId;
            const name = socket.data.name || 'Anonymous';
            const senderIsAdmin = isAdmin || socket.data.isAdmin || false;
            if (!incomingRoomId) {
                socket.emit('error', { message: 'No room specified' });
                return;
            }
            try {
                let chatRoom;
                if (senderIsAdmin) {
                    // Admin uses UUID usually, but might receive SessionID from legacy events. Support both.
                    chatRoom = await prisma.chatRoom.findFirst({
                        where: {
                            OR: [
                                { id: incomingRoomId },
                                { sessionId: incomingRoomId }
                            ],
                            deletedAt: null
                        }
                    });
                }
                else {
                    // Guest uses Session ID
                    chatRoom = await prisma.chatRoom.findUnique({
                        where: { sessionId: incomingRoomId }
                    });
                }
                if (chatRoom) {
                    // Save to database
                    const senderIdToSave = socket.data.user?.id || null;
                    logger_1.logger.info(`Attempting to save message`, {
                        content: message,
                        isAdmin: senderIsAdmin,
                        roomId: incomingRoomId,
                        resolvedSenderId: senderIdToSave,
                        socketUser: socket.data.user
                    });
                    const savedMessage = await prisma.chatMessage.create({
                        data: {
                            content: message,
                            senderName: name,
                            senderId: socket.data.user?.id || null, // Use authenticated ID or null (for guest/admin in public namespace without auth)
                            isAdmin: senderIsAdmin,
                            chatRoomId: chatRoom.id,
                            messageType: 'text',
                            isRead: false
                        }
                    });
                    // Update room last message
                    await prisma.chatRoom.update({
                        where: { id: chatRoom.id },
                        data: { lastMessageAt: new Date() }
                    });
                    const messagePayload = {
                        id: savedMessage.id,
                        senderId: socket.id,
                        senderName: name,
                        message,
                        timestamp: savedMessage.timestamp,
                        isAdmin: senderIsAdmin,
                    };
                    // Send to Guest (in Session Room)
                    // Guest expects roomId = SessionID
                    const sessionId = chatRoom.sessionId;
                    if (sessionId) {
                        publicChat.to(sessionId).emit('message', {
                            ...messagePayload,
                            roomId: sessionId
                        });
                    }
                    // Send to Admin (in Admin Room)
                    // Admin expects roomId = ChatRoom.id (UUID)
                    publicChat.to('admin_room').emit('message', {
                        ...messagePayload,
                        roomId: chatRoom.id
                    });
                    logger_1.logger.info(`Private chat message persisted in room ${chatRoom.id} (Sender: ${senderIsAdmin ? 'Admin' : 'Guest'})`);
                }
                else {
                    logger_1.logger.warn(`Chat room not found for id/session: ${incomingRoomId}, message not persisted.`);
                }
            }
            catch (error) {
                logger_1.logger.error('Error saving message', { error });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.info('Public chat user disconnected', { socketId: socket.id });
        });
    });
    /**
     * Authentication Middleware
     *
     * ตรวจสอบ JWT token ก่อนอนุญาตให้เชื่อมต่อ (สำหรับ authenticated sockets)
     */
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                logger_1.logger.error('JWT_SECRET is not configured');
                return next(new Error('Server configuration error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Check if user exists and is active
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    deletedAt: true,
                },
            });
            if (!user || !user.isActive || user.deletedAt) {
                return next(new Error('User not found or inactive'));
            }
            // Attach user to socket
            socket.data.user = {
                ...decoded,
                id: user.id,
            };
            next();
        }
        catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return next(new Error('Invalid or expired token'));
            }
            logger_1.logger.error('Socket authentication error', { error: error.message });
            next(new Error('Authentication failed'));
        }
    });
    /**
     * Connection Handler
     */
    io.on('connection', (socket) => {
        const user = socket.data.user;
        logger_1.logger.info(`Socket connected: ${user.email}`, { userId: user.id });
        // Join user-specific rooms based on role
        if (user.role === 'admin') {
            socket.join('admin');
        }
        else if (user.role === 'tenant') {
            // Find tenant
            prisma.tenant
                .findFirst({
                where: {
                    userId: user.id,
                    status: 'active',
                    deletedAt: null,
                },
            })
                .then((tenant) => {
                if (tenant) {
                    socket.join(`tenant:${tenant.id}`);
                }
            });
        }
        else {
            socket.join(`guest:${user.id}`);
        }
        /**
         * Join Chat Room
         *
         * @event join_room
         * @param {string} chatRoomId - Chat room ID
         */
        socket.on('join_room', async (chatRoomId) => {
            try {
                // Check if user has access to this chat room
                const hasAccess = await checkChatRoomAccess(chatRoomId, user.id, user.role);
                if (!hasAccess) {
                    socket.emit('error', { message: 'Unauthorized access to chat room' });
                    return;
                }
                socket.join(`chat_room:${chatRoomId}`);
                logger_1.logger.info(`User joined chat room: ${chatRoomId}`, { userId: user.id });
                // Notify others in the room
                socket.to(`chat_room:${chatRoomId}`).emit('user_joined', {
                    userId: user.id,
                    email: user.email,
                });
            }
            catch (error) {
                logger_1.logger.error('Error joining chat room', { error: error.message });
                socket.emit('error', { message: 'Failed to join chat room' });
            }
        });
        /**
         * Leave Chat Room
         *
         * @event leave_room
         * @param {string} chatRoomId - Chat room ID
         */
        socket.on('leave_room', (chatRoomId) => {
            socket.leave(`chat_room:${chatRoomId}`);
            logger_1.logger.info(`User left chat room: ${chatRoomId}`, { userId: user.id });
        });
        /**
         * Send Message
         *
         * @event send_message
         * @param {object} data - { chatRoomId, content, messageType?, fileUrl? }
         */
        socket.on('send_message', async (data) => {
            try {
                const { chatRoomId, content, messageType = 'text', fileUrl } = data;
                // Validate input
                if (!chatRoomId || !content) {
                    socket.emit('error', { message: 'Chat room ID and content are required' });
                    return;
                }
                // Check access
                const hasAccess = await checkChatRoomAccess(chatRoomId, user.id, user.role);
                if (!hasAccess) {
                    socket.emit('error', { message: 'Unauthorized access to chat room' });
                    return;
                }
                // Save message to database
                const message = await prisma.chatMessage.create({
                    data: {
                        chatRoomId,
                        senderId: user.id,
                        content,
                        messageType: messageType,
                        fileUrl,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                            },
                        },
                    },
                });
                // Update chat room last message time
                await prisma.chatRoom.update({
                    where: { id: chatRoomId },
                    data: { lastMessageAt: new Date() },
                });
                // Broadcast message to all users in the room
                io.to(`chat_room:${chatRoomId}`).emit('new_message', {
                    id: message.id,
                    chatRoomId: message.chatRoomId,
                    sender: message.sender,
                    content: message.content,
                    messageType: message.messageType,
                    fileUrl: message.fileUrl,
                    createdAt: message.createdAt,
                });
                logger_1.logger.info(`Message sent in chat room: ${chatRoomId}`, {
                    messageId: message.id,
                    userId: user.id,
                });
            }
            catch (error) {
                logger_1.logger.error('Error sending message', { error: error.message });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        /**
         * Mark Message as Read
         *
         * @event mark_read
         * @param {object} data - { chatRoomId, messageId }
         */
        socket.on('mark_read', async (data) => {
            try {
                const { chatRoomId, messageId } = data;
                // Check access
                const hasAccess = await checkChatRoomAccess(chatRoomId, user.id, user.role);
                if (!hasAccess) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }
                // Update message
                await prisma.chatMessage.update({
                    where: { id: messageId },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });
                // Notify sender
                socket.to(`chat_room:${chatRoomId}`).emit('message_read', {
                    messageId,
                    readBy: user.id,
                });
            }
            catch (error) {
                logger_1.logger.error('Error marking message as read', { error: error.message });
            }
        });
        /**
         * Typing Indicator
         *
         * @event typing_start
         * @param {string} chatRoomId - Chat room ID
         */
        socket.on('typing_start', (chatRoomId) => {
            socket.to(`chat_room:${chatRoomId}`).emit('user_typing', {
                userId: user.id,
                email: user.email,
            });
        });
        /**
         * Stop Typing Indicator
         *
         * @event typing_stop
         * @param {string} chatRoomId - Chat room ID
         */
        socket.on('typing_stop', (chatRoomId) => {
            socket.to(`chat_room:${chatRoomId}`).emit('user_stopped_typing', {
                userId: user.id,
            });
        });
        /**
         * Disconnect Handler
         */
        socket.on('disconnect', () => {
            logger_1.logger.info(`Socket disconnected: ${user.email}`, { userId: user.id });
        });
    });
    logger_1.logger.info('Socket.io initialized');
}
/**
 * Check Chat Room Access
 *
 * @param chatRoomId - Chat room ID
 * @param userId - User ID
 * @param userRole - User role
 * @returns Promise<boolean>
 *
 * @description
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง chat room นี้หรือไม่
 */
async function checkChatRoomAccess(chatRoomId, userId, userRole) {
    try {
        const chatRoom = await prisma.chatRoom.findUnique({
            where: { id: chatRoomId },
        });
        if (!chatRoom || chatRoom.deletedAt || !chatRoom.isActive) {
            return false;
        }
        // Admin can access all chat rooms
        if (userRole === 'admin') {
            return true;
        }
        // Check if user is a participant
        return (chatRoom.tenantId !== null ||
            chatRoom.guestUserId === userId ||
            chatRoom.adminUserId === userId);
    }
    catch (error) {
        logger_1.logger.error('Error checking chat room access', { error });
        return false;
    }
}
//# sourceMappingURL=socket.io.js.map
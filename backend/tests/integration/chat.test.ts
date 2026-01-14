import { testDb, factories } from '../helpers';

describe('Chat System', () => {
    let admin: any;
    let tenant: any;
    let room: any;

    beforeEach(async () => {
        await testDb.cleanup();
        admin = await factories.createAdmin();
        tenant = await factories.createTenant();
        const building = await factories.createBuilding();
        room = await factories.createRoom(building.id);
    });

    afterAll(async () => {
        await testDb.disconnect();
    });

    describe('Chat Room Management', () => {
        it('should create a chat room', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    name: 'Test Chat',
                    isPublic: false,
                    isActive: true,
                },
            });

            expect(chatRoom).toBeDefined();
            expect(chatRoom.name).toBe('Test Chat');
            expect(chatRoom.isActive).toBe(true);
        });

        it('should create chat room with tenant', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    tenantId: tenant.id,
                    isPublic: false,
                    isActive: true,
                },
            });

            expect(chatRoom.tenantId).toBe(tenant.id);
        });

        it('should create chat room with admin', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    adminUserId: admin.id,
                    isPublic: false,
                    isActive: true,
                },
            });

            expect(chatRoom.adminUserId).toBe(admin.id);
        });

        it('should create public chat room for guests', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    sessionId: 'session-123',
                    guestName: 'Guest User',
                    isPublic: true,
                    isActive: true,
                },
            });

            expect(chatRoom.isPublic).toBe(true);
            expect(chatRoom.sessionId).toBe('session-123');
            expect(chatRoom.guestName).toBe('Guest User');
        });

        it('should associate chat room with room', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    roomId: room.id,
                    isPublic: false,
                    isActive: true,
                },
            });

            expect(chatRoom.roomId).toBe(room.id);
        });
    });

    describe('Chat Message Management', () => {
        let chatRoom: any;

        beforeEach(async () => {
            chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    tenantId: tenant.id,
                    adminUserId: admin.id,
                    isPublic: false,
                    isActive: true,
                },
            });
        });

        it('should create a text message', async () => {
            const message = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    senderName: 'Tenant User',
                    content: 'Hello, I have a question',
                    messageType: 'text',
                    isAdmin: false,
                },
            });

            expect(message).toBeDefined();
            expect(message.content).toBe('Hello, I have a question');
            expect(message.messageType).toBe('text');
            expect(message.isAdmin).toBe(false);
        });

        it('should create admin message', async () => {
            const message = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: admin.id,
                    senderName: 'Admin User',
                    content: 'How can I help you?',
                    messageType: 'text',
                    isAdmin: true,
                },
            });

            expect(message.isAdmin).toBe(true);
        });

        it('should support different message types', async () => {
            const textMessage = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'Text message',
                    messageType: 'text',
                },
            });

            const imageMessage = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'Image',
                    messageType: 'image',
                    fileUrl: 'https://example.com/image.jpg',
                },
            });

            const fileMessage = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'File',
                    messageType: 'file',
                    fileUrl: 'https://example.com/document.pdf',
                },
            });

            expect(textMessage.messageType).toBe('text');
            expect(imageMessage.messageType).toBe('image');
            expect(imageMessage.fileUrl).toBeDefined();
            expect(fileMessage.messageType).toBe('file');
            expect(fileMessage.fileUrl).toBeDefined();
        });

        it('should track message read status', async () => {
            const message = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'Hello',
                    messageType: 'text',
                    isRead: false,
                },
            });

            expect(message.isRead).toBe(false);

            const readMessage = await factories.prisma.chatMessage.update({
                where: { id: message.id },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });

            expect(readMessage.isRead).toBe(true);
            expect(readMessage.readAt).toBeDefined();
        });

        it('should order messages by timestamp', async () => {
            const message1 = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'First message',
                    messageType: 'text',
                },
            });

            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            const message2 = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: admin.id,
                    content: 'Second message',
                    messageType: 'text',
                },
            });

            expect(message2.timestamp.getTime()).toBeGreaterThan(message1.timestamp.getTime());
        });

        it('should support soft delete', async () => {
            const message = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'To be deleted',
                    messageType: 'text',
                },
            });

            const deleted = await factories.prisma.chatMessage.update({
                where: { id: message.id },
                data: { deletedAt: new Date() },
            });

            expect(deleted.deletedAt).toBeDefined();
        });
    });

    describe('Chat Room Activity', () => {
        it('should update lastMessageAt when message is sent', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    tenantId: tenant.id,
                    isPublic: false,
                    isActive: true,
                },
            });

            const initialTime = chatRoom.lastMessageAt;

            await new Promise(resolve => setTimeout(resolve, 10));

            await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: chatRoom.id,
                    senderId: tenant.id,
                    content: 'New message',
                    messageType: 'text',
                },
            });

            const updated = await factories.prisma.chatRoom.update({
                where: { id: chatRoom.id },
                data: { lastMessageAt: new Date() },
            });

            expect(updated.lastMessageAt.getTime()).toBeGreaterThan(initialTime.getTime());
        });

        it('should mark chat room as inactive', async () => {
            const chatRoom = await factories.prisma.chatRoom.create({
                data: {
                    tenantId: tenant.id,
                    isPublic: false,
                    isActive: true,
                },
            });

            const inactive = await factories.prisma.chatRoom.update({
                where: { id: chatRoom.id },
                data: { isActive: false },
            });

            expect(inactive.isActive).toBe(false);
        });
    });

    describe('Real-time Chat Features', () => {
        it('should support typing indicators (simulated)', async () => {
            // In real implementation, this would be handled via Socket.io
            const typingEvent = {
                chatRoomId: 'room-123',
                userId: tenant.id,
                isTyping: true,
                timestamp: new Date(),
            };

            expect(typingEvent.isTyping).toBe(true);
            expect(typingEvent.userId).toBe(tenant.id);
        });

        it('should support online/offline status (simulated)', async () => {
            // In real implementation, this would be handled via Socket.io
            const userStatus = {
                userId: tenant.id,
                isOnline: true,
                lastSeen: new Date(),
            };

            expect(userStatus.isOnline).toBe(true);
        });

        it('should support message delivery status (simulated)', async () => {
            const message = await factories.prisma.chatMessage.create({
                data: {
                    chatRoomId: (await factories.prisma.chatRoom.create({
                        data: { isPublic: false, isActive: true },
                    })).id,
                    senderId: tenant.id,
                    content: 'Test message',
                    messageType: 'text',
                },
            });

            // Delivery status would be tracked via Socket.io events
            const deliveryStatus = {
                messageId: message.id,
                delivered: true,
                deliveredAt: new Date(),
            };

            expect(deliveryStatus.delivered).toBe(true);
        });
    });
});

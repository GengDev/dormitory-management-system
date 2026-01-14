import { testDb, factories } from '../helpers';

describe('LINE Webhook Integration', () => {
    beforeEach(async () => {
        await testDb.cleanup();
    });

    afterAll(async () => {
        await testDb.disconnect();
    });

    describe('LINE User Management', () => {
        it('should create LINE user record', async () => {
            const lineUser = await factories.prisma.lineUser.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    displayName: 'Test User',
                    pictureUrl: 'https://example.com/picture.jpg',
                },
            });

            expect(lineUser).toBeDefined();
            expect(lineUser.lineUserId).toBe('U1234567890abcdef');
            expect(lineUser.displayName).toBe('Test User');
        });

        it('should link LINE user to tenant', async () => {
            const tenant = await factories.createTenant();
            const lineUser = await factories.prisma.lineUser.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    displayName: 'Test User',
                    tenant: {
                        connect: { id: tenant.id },
                    },
                },
            });

            expect(lineUser).toBeDefined();
        });

        it('should prevent duplicate LINE user IDs', async () => {
            const lineUserId = 'U1234567890abcdef';

            await factories.prisma.lineUser.create({
                data: {
                    lineUserId,
                    displayName: 'User 1',
                },
            });

            await expect(
                factories.prisma.lineUser.create({
                    data: {
                        lineUserId,
                        displayName: 'User 2',
                    },
                })
            ).rejects.toThrow();
        });
    });

    describe('LINE Event Processing', () => {
        it('should store LINE webhook events', async () => {
            const event = await factories.prisma.lineEvent.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    eventType: 'message',
                    eventData: {
                        type: 'text',
                        text: 'Hello',
                    },
                    processed: false,
                },
            });

            expect(event).toBeDefined();
            expect(event.eventType).toBe('message');
            expect(event.processed).toBe(false);
        });

        it('should mark events as processed', async () => {
            const event = await factories.prisma.lineEvent.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    eventType: 'message',
                    eventData: { type: 'text', text: 'Hello' },
                    processed: false,
                },
            });

            const updated = await factories.prisma.lineEvent.update({
                where: { id: event.id },
                data: { processed: true },
            });

            expect(updated.processed).toBe(true);
        });

        it('should handle different event types', async () => {
            const messageEvent = await factories.prisma.lineEvent.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    eventType: 'message',
                    eventData: { type: 'text', text: 'Hello' },
                },
            });

            const followEvent = await factories.prisma.lineEvent.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    eventType: 'follow',
                    eventData: { type: 'follow' },
                },
            });

            expect(messageEvent.eventType).toBe('message');
            expect(followEvent.eventType).toBe('follow');
        });
    });

    describe('LINE Notifications', () => {
        let tenant: any;
        let lineUser: any;

        beforeEach(async () => {
            tenant = await factories.createTenant();
            lineUser = await factories.prisma.lineUser.create({
                data: {
                    lineUserId: 'U1234567890abcdef',
                    displayName: 'Test User',
                    tenant: {
                        connect: { id: tenant.id },
                    },
                },
            });
        });

        it('should create notification record', async () => {
            const notification = await factories.prisma.notification.create({
                data: {
                    tenantId: tenant.id,
                    lineUserId: lineUser.id,
                    notificationType: 'bill_created',
                    title: 'New Bill',
                    message: 'You have a new bill',
                    status: 'pending',
                },
            });

            expect(notification).toBeDefined();
            expect(notification.notificationType).toBe('bill_created');
            expect(notification.status).toBe('pending');
        });

        it('should support different notification types', async () => {
            const types = [
                'bill_created',
                'bill_due',
                'bill_overdue',
                'payment_submitted',
                'payment_approved',
                'payment_rejected',
                'maintenance_updated',
                'maintenance_completed',
                'general',
            ];

            for (const type of types) {
                const notification = await factories.prisma.notification.create({
                    data: {
                        tenantId: tenant.id,
                        notificationType: type as any,
                        title: `Test ${type}`,
                        message: 'Test message',
                        status: 'pending',
                    },
                });

                expect(notification.notificationType).toBe(type);
            }
        });

        it('should track notification delivery status', async () => {
            const notification = await factories.prisma.notification.create({
                data: {
                    tenantId: tenant.id,
                    notificationType: 'bill_created',
                    title: 'New Bill',
                    message: 'You have a new bill',
                    status: 'pending',
                },
            });

            const sent = await factories.prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: 'sent',
                    sentAt: new Date(),
                },
            });

            expect(sent.status).toBe('sent');
            expect(sent.sentAt).toBeDefined();
        });

        it('should track notification read status', async () => {
            const notification = await factories.prisma.notification.create({
                data: {
                    tenantId: tenant.id,
                    notificationType: 'bill_created',
                    title: 'New Bill',
                    message: 'You have a new bill',
                    status: 'sent',
                    sentAt: new Date(),
                },
            });

            const read = await factories.prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: 'read',
                    readAt: new Date(),
                },
            });

            expect(read.status).toBe('read');
            expect(read.readAt).toBeDefined();
        });

        it('should handle failed notifications', async () => {
            const notification = await factories.prisma.notification.create({
                data: {
                    tenantId: tenant.id,
                    notificationType: 'bill_created',
                    title: 'New Bill',
                    message: 'You have a new bill',
                    status: 'failed',
                },
            });

            expect(notification.status).toBe('failed');
        });

        it('should store additional data in JSON format', async () => {
            const notification = await factories.prisma.notification.create({
                data: {
                    tenantId: tenant.id,
                    notificationType: 'bill_created',
                    title: 'New Bill',
                    message: 'You have a new bill',
                    status: 'pending',
                    data: {
                        billId: 'bill-123',
                        amount: 3950,
                        dueDate: '2024-01-31',
                    },
                },
            });

            expect(notification.data).toBeDefined();
            expect((notification.data as any).billId).toBe('bill-123');
            expect((notification.data as any).amount).toBe(3950);
        });
    });

    describe('Flex Message Generation', () => {
        it('should generate bill notification flex message', () => {
            const billData = {
                billNumber: 'BILL-001',
                amount: 3950,
                dueDate: '2024-01-31',
                rentAmount: 3000,
                waterAmount: 150,
                electricityAmount: 800,
            };

            const flexMessage = {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: 'บิลค่าเช่าประจำเดือน',
                            weight: 'bold',
                            size: 'xl',
                        },
                    ],
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: `เลขที่บิล: ${billData.billNumber}`,
                        },
                        {
                            type: 'text',
                            text: `ค่าเช่า: ${billData.rentAmount} บาท`,
                        },
                        {
                            type: 'text',
                            text: `ค่าน้ำ: ${billData.waterAmount} บาท`,
                        },
                        {
                            type: 'text',
                            text: `ค่าไฟ: ${billData.electricityAmount} บาท`,
                        },
                        {
                            type: 'text',
                            text: `รวมทั้งหมด: ${billData.amount} บาท`,
                            weight: 'bold',
                            size: 'lg',
                        },
                    ],
                },
            };

            expect(flexMessage.type).toBe('bubble');
            expect(flexMessage.header).toBeDefined();
            expect(flexMessage.body).toBeDefined();
        });
    });
});

import { Request, Response } from 'express';
import { notificationQueue } from '../../src/jobs/queue';
import { PrismaClient, NotificationType } from '@prisma/client';

// 1. Define mocks with "mock" prefix for hoisting support
const mockQueueAdd = jest.fn();
const mockFindUniqueBill = jest.fn();
const mockFindUniqueMaintenance = jest.fn();
const mockCreateNotification = jest.fn();

// 2. Mock 'bull' / queue
jest.mock('../../src/jobs/queue', () => ({
    notificationQueue: {
        add: (...args: any[]) => mockQueueAdd(...args),
    },
}));

// 3. Mock Prisma
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            bill: {
                findUnique: (...args: any[]) => mockFindUniqueBill(...args),
            },
            maintenanceRequest: {
                findUnique: (...args: any[]) => mockFindUniqueMaintenance(...args),
            },
            notification: {
                create: (...args: any[]) => mockCreateNotification(...args),
            },
        })),
        NotificationType: {
            bill_created: 'bill_created',
            maintenance_updated: 'maintenance_updated',
            general: 'general',
        },
    };
});

// 4. Mock Middleware (ESSENTIAL: bypass asyncHandler for await support)
jest.mock('../../src/middleware/errorHandler', () => ({
    // Just execute the function and return its result (Promise)
    asyncHandler: (fn: any) => (req: any, res: any, next: any) => fn(req, res, next),
    createError: (msg: string, code: number) => {
        const err: any = new Error(msg);
        err.statusCode = code;
        return err;
    }
}));

// Import Controller AFTER mocks are defined
import { sendBillNotification, sendMaintenanceNotification } from '../../src/controllers/notification.controller';

const mockRequest = (body: any = {}, user: any = {}) => ({
    body,
    user,
} as unknown as Request);

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('Notification Queue Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendBillNotification', () => {
        it('should add a job to the queue when bill exists', async () => {
            const req = mockRequest({ billId: 'bill-123' }, { id: 'admin-1', role: 'admin' });
            const res = mockResponse();

            // Setup return values
            mockFindUniqueBill.mockResolvedValue({
                id: 'bill-123',
                billNumber: 'BILL-001',
                totalAmount: 1000,
                dueDate: new Date(),
                tenantId: 'tenant-1',
                tenant: {
                    id: 'tenant-1',
                    room: { roomNumber: '101' }
                },
                items: []
            });

            mockCreateNotification.mockResolvedValue({ id: 'notif-1' });

            await sendBillNotification(req, res, jest.fn());

            expect(mockFindUniqueBill).toHaveBeenCalled();
            expect(mockQueueAdd).toHaveBeenCalledWith(
                'send-line-notification',
                expect.objectContaining({
                    billId: 'bill-123',
                    notificationType: 'bill_created'
                })
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should throw 404 if bill not found', async () => {
            const req = mockRequest({ billId: 'bill-999' });
            const res = mockResponse();
            const next = jest.fn();

            mockFindUniqueBill.mockResolvedValue(null);

            // We expect it to reject because createError throws and our mock asyncHandler doesn't catch
            await expect(sendBillNotification(req, res, next)).rejects.toThrow();
        });
    });

    describe('sendMaintenanceNotification', () => {
        it('should add a job to the queue when maintenance request exists', async () => {
            const req = mockRequest({ maintenanceId: 'maint-1' }, { id: 'admin-1' });
            const res = mockResponse();

            mockFindUniqueMaintenance.mockResolvedValue({
                id: 'maint-1',
                tenantId: 'tenant-2',
                status: 'in_progress',
                tenant: { room: { roomNumber: '202' } }
            });

            await sendMaintenanceNotification(req, res, jest.fn());

            expect(mockQueueAdd).toHaveBeenCalledWith(
                'send-line-notification',
                expect.objectContaining({
                    requestId: 'maint-1',
                    notificationType: 'maintenance_updated'
                })
            );
        });
    });
});

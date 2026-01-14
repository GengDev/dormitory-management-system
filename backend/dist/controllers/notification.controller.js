"use strict";
/**
 * Notification Controller
 *
 * Controller สำหรับจัดการ notifications และส่งแจ้งเตือน
 *
 * @module server/src/controllers/notification.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCustomNotification = exports.sendMaintenanceNotification = exports.sendBillNotification = exports.createNotification = exports.getNotifications = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const queue_1 = require("../jobs/queue");
const prisma = new client_1.PrismaClient();
/**
 * Get All Notifications
 */
exports.getNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenantId, notificationType, status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (tenantId && req.user?.role === 'tenant') {
        // Tenants can only see their own notifications
        where.tenantId = req.user?.id;
    }
    else if (tenantId) {
        where.tenantId = tenantId;
    }
    else if (req.user?.role === 'tenant') {
        where.tenantId = req.user?.id;
    }
    if (notificationType)
        where.notificationType = notificationType;
    if (status)
        where.status = status;
    const notifications = await prisma.notification.findMany({
        where,
        include: {
            tenant: {
                select: {
                    id: true,
                    fullName: true,
                    room: {
                        select: {
                            id: true,
                            roomNumber: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
    });
    const total = await prisma.notification.count({ where });
    res.json({
        success: true,
        data: {
            notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});
/**
 * Create Notification (Internal)
 */
exports.createNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenantId, title, message, type, metadata } = req.body;
    const notification = await prisma.notification.create({
        data: {
            tenantId,
            title,
            message,
            notificationType: type || client_1.NotificationType.general,
            status: 'pending',
            data: metadata || {}
        }
    });
    res.json({
        success: true,
        data: notification
    });
});
/**
 * Send Bill Notification
 */
exports.sendBillNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { billId, tenantId } = req.body;
    // Get bill details
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: {
            tenant: {
                include: {
                    room: true
                }
            },
            items: true
        }
    });
    if (!bill) {
        throw (0, errorHandler_2.createError)('Bill not found', 404);
    }
    // Create notification
    await prisma.notification.create({
        data: {
            tenantId: tenantId || bill.tenantId,
            title: `บิลใหม่ ${bill.billNumber}`,
            message: `มีบิลใหม่สำหรับห้อง ${bill.tenant.room?.roomNumber || 'N/A'} จำนวน ${Number(bill.totalAmount).toLocaleString()} บาท ครบกำหนดวันที่ ${bill.dueDate.toLocaleDateString('th-TH')}`,
            notificationType: client_1.NotificationType.bill_created,
            status: 'pending',
            data: {
                billId: bill.id,
                billNumber: bill.billNumber,
                amount: Number(bill.totalAmount),
                dueDate: bill.dueDate
            }
        }
    });
    // Send LINE notification
    try {
        await queue_1.notificationQueue.add('send-line-notification', {
            tenantId: tenantId || bill.tenantId,
            billId: bill.id,
            notificationType: client_1.NotificationType.bill_created
        });
    }
    catch (error) {
        // Log error but don't fail the request since the notification record is already created
        console.error('Failed to queue bill notification:', error);
    }
    res.json({
        success: true,
        message: 'Bill notification sent successfully'
    });
});
/**
 * Send Maintenance Notification
 */
exports.sendMaintenanceNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { maintenanceId, tenantId, message } = req.body;
    // Get maintenance details
    const maintenance = await prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceId },
        include: {
            tenant: {
                include: {
                    room: true
                }
            }
        }
    });
    if (!maintenance) {
        throw (0, errorHandler_2.createError)('Maintenance request not found', 404);
    }
    // Create notification
    await prisma.notification.create({
        data: {
            tenantId: tenantId || maintenance.tenantId,
            title: 'อัพเดทการแจ้งซ่อม',
            message: message || `การแจ้งซ่อมของคุณได้รับการอัพเดทแล้ว สถานะ: ${maintenance.status}`,
            notificationType: client_1.NotificationType.maintenance_updated,
            status: 'pending',
            data: {
                maintenanceId: maintenance.id,
                status: maintenance.status,
                updatedBy: req.user?.id
            }
        }
    });
    // Send LINE notification
    try {
        await queue_1.notificationQueue.add('send-line-notification', {
            tenantId: tenantId || maintenance.tenantId,
            requestId: maintenance.id, // notification.processor uses requestId for maintenance
            title: 'อัพเดทการแจ้งซ่อม',
            status: maintenance.status,
            notificationType: client_1.NotificationType.maintenance_updated
        });
    }
    catch (error) {
        console.error('Failed to queue maintenance notification:', error);
    }
    res.json({
        success: true,
        message: 'Maintenance notification sent successfully'
    });
});
/**
 * Send Custom Notification
 */
exports.sendCustomNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenantId, title, message, type } = req.body;
    // Create notification
    await prisma.notification.create({
        data: {
            tenantId,
            title,
            message,
            notificationType: type || client_1.NotificationType.general,
            status: 'pending',
            data: {
                sentBy: req.user?.id,
                custom: true
            }
        }
    });
    // Send LINE notification
    try {
        await queue_1.notificationQueue.add('send-line-notification', {
            tenantId,
            title,
            message,
            notificationType: type || client_1.NotificationType.general
        });
    }
    catch (error) {
        console.error('Failed to queue custom notification:', error);
    }
    res.json({
        success: true,
        message: 'Custom notification sent successfully'
    });
});
//# sourceMappingURL=notification.controller.js.map
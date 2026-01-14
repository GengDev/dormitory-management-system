"use strict";
/**
 * Notification Job Processor
 *
 * Process notification jobs สำหรับส่ง LINE notifications
 *
 * @module server/src/jobs/processors/notification.processor
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotificationJob = processNotificationJob;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const lineFlexMessage_service_1 = require("../../services/lineFlexMessage.service");
const prisma = new client_1.PrismaClient();
/**
 * Process Notification Job
 *
 * @param data - Job data { tenantId, billId?, notificationType, ... }
 * @returns Processing result
 *
 * @description
 * ส่ง LINE notification ไปยังผู้เช่า
 * รองรับหลาย notification types:
 * - bill_due: แจ้งเตือนบิลใกล้ครบกำหนด
 * - bill_overdue: แจ้งเตือนบิลค้างชำระ
 * - payment_confirmed: ยืนยันการชำระเงิน
 * - maintenance_update: อัพเดทสถานะแจ้งซ่อม
 */
async function processNotificationJob(data) {
    try {
        const { tenantId, billId, notificationType } = data;
        // Get tenant with LINE user
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                lineUser: true,
                room: {
                    include: {
                        building: true,
                    },
                },
            },
        });
        if (!tenant || !tenant.lineUser) {
            logger_1.logger.warn(`Cannot send notification: tenant ${tenantId} has no linked LINE user`);
            return { success: false };
        }
        const lineUserId = tenant.lineUser.lineUserId;
        // Build notification based on type
        let flexMessage;
        let altText;
        switch (notificationType) {
            case 'bill_created':
            case 'bill_due':
            case 'bill_overdue':
                if (!billId) {
                    throw new Error('billId is required for bill notifications');
                }
                const bill = await prisma.bill.findUnique({
                    where: { id: billId },
                    include: {
                        items: true,
                    },
                });
                if (!bill) {
                    throw new Error(`Bill not found: ${billId}`);
                }
                if (notificationType === 'bill_overdue') {
                    const daysOverdue = Math.floor((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                    flexMessage = (0, lineFlexMessage_service_1.buildFlexMessage)('bill_overdue', {
                        billId: bill.id,
                        billNumber: bill.billNumber,
                        remainingAmount: Number(bill.totalAmount) - Number(bill.paidAmount),
                        daysOverdue,
                        dueDate: bill.dueDate.toISOString().split('T')[0],
                    });
                    altText = 'บิลค้างชำระ';
                }
                else {
                    // Calculate amounts from items - Handle 'utility' type by searching description or metadata
                    const rentItem = bill.items.find((item) => item.itemType === 'rent');
                    const waterItem = bill.items.find((item) => item.itemType === 'water' ||
                        (item.itemType === 'utility' && item.description.includes('น้ำ')) ||
                        (item.metadata && item.metadata.type === 'water'));
                    const electricityItem = bill.items.find((item) => item.itemType === 'electricity' ||
                        (item.itemType === 'utility' && (item.description.includes('ไฟ') || item.description.includes('Electric'))) ||
                        (item.metadata && item.metadata.type === 'electricity'));
                    flexMessage = (0, lineFlexMessage_service_1.buildFlexMessage)('bill_notification', {
                        billingMonth: bill.billingMonth.toISOString().split('T')[0],
                        roomNumber: tenant.room?.roomNumber || 'N/A',
                        rentAmount: rentItem ? Number(rentItem.amount) : (bill.rentAmount || 0),
                        waterAmount: waterItem ? Number(waterItem.amount) : (bill.waterAmount || 0),
                        electricityAmount: electricityItem ? Number(electricityItem.amount) : (bill.electricityAmount || 0),
                        totalAmount: Number(bill.totalAmount),
                        dueDate: bill.dueDate.toISOString().split('T')[0],
                        billId: bill.id,
                    });
                    altText = 'แจ้งเตือนบิลค่าเช่า';
                }
                break;
            case 'maintenance_updated':
            case 'maintenance_completed':
                flexMessage = (0, lineFlexMessage_service_1.buildFlexMessage)('maintenance_confirmation', {
                    requestId: data.requestId,
                    title: data.title,
                    status: data.status,
                });
                altText = 'อัปเดตสถานะการแจ้งซ่อม';
                break;
            case 'payment_submitted':
            case 'payment_approved':
            case 'payment_rejected':
            case 'general':
                flexMessage = {
                    type: 'bubble',
                    body: {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: data.title || 'แจ้งเตือนจากระบบ',
                                weight: 'bold',
                                size: 'xl',
                            },
                            {
                                type: 'text',
                                text: data.message || '',
                                wrap: true,
                                margin: 'md',
                            },
                        ],
                    },
                };
                altText = data.title || 'แจ้งเตือนใหม่';
                break;
            default:
                throw new Error(`Unknown notification type: ${notificationType}`);
        }
        // Send via LINE API
        const accessToken = process.env.LINE_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('LINE_ACCESS_TOKEN is not configured');
        }
        const response = await axios_1.default.post('https://api.line.me/v2/bot/message/push', {
            to: lineUserId,
            messages: [
                {
                    type: 'flex',
                    altText,
                    contents: flexMessage,
                },
            ],
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });
        // Create notification record
        const notification = await prisma.notification.create({
            data: {
                tenantId,
                lineUserId: tenant.lineUser.id,
                notificationType: notificationType,
                title: altText,
                message: `Notification sent to ${tenant.fullName}`,
                status: 'sent',
                sentAt: new Date(),
                data: { billId, ...data, flexMessagePayload: flexMessage },
            },
        });
        logger_1.logger.info(`Notification sent successfully`, {
            notificationId: notification.id,
            tenantId,
            notificationType,
        });
        return {
            success: true,
            messageId: response.data.messageId || notification.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to process notification job', {
            error: error.message,
            data,
        });
        // Create failed notification record
        try {
            await prisma.notification.create({
                data: {
                    tenantId: data.tenantId,
                    notificationType: data.notificationType,
                    title: 'Notification Failed',
                    message: error.message,
                    status: 'failed',
                    data: { ...data, error: error.message },
                },
            });
        }
        catch (dbError) {
            logger_1.logger.error('Failed to create notification record', { error: dbError });
        }
        throw error; // Re-throw to trigger retry
    }
}
//# sourceMappingURL=notification.processor.js.map
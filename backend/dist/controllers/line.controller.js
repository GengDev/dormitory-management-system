"use strict";
/**
 * LINE Controller
 *
 * Controller สำหรับจัดการ LINE webhook events และส่ง Flex Messages
 *
 * @module server/src/controllers/line.controller
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnlinkedLineUsers = exports.sendFlexMessage = exports.sendMessage = exports.handleWebhook = exports.verifySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const errorHandler_2 = require("../middleware/errorHandler");
const lineFlexMessage_service_1 = require("../services/lineFlexMessage.service");
const prisma = new client_1.PrismaClient();
/**
 * Verify LINE Webhook Signature
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @description
 * ตรวจสอบ LINE signature เพื่อยืนยันว่า request มาจาก LINE Platform จริง
 */
const verifySignature = (req, res, next) => {
    try {
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        if (!channelSecret) {
            logger_1.logger.error('LINE_CHANNEL_SECRET is not configured');
            next((0, errorHandler_2.createError)('Server configuration error', 500));
            return;
        }
        const signature = req.headers['x-line-signature'];
        if (!signature) {
            logger_1.logger.warn('LINE webhook called without signature');
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const body = JSON.stringify(req.body);
        const hash = crypto_1.default
            .createHmac('sha256', channelSecret)
            .update(body)
            .digest('base64');
        if (signature !== hash) {
            logger_1.logger.warn('Invalid LINE signature');
            res.status(401).json({ message: 'Invalid signature' });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Signature verification error', { error: error.message });
        next((0, errorHandler_2.createError)('Signature verification failed', 500));
    }
};
exports.verifySignature = verifySignature;
/**
 * Handle LINE Webhook Events
 *
 * @route   POST /api/line/webhook
 * @access  Public (verified by signature)
 *
 * @param req - Express request (body: LINE webhook events)
 * @param res - Express response
 *
 * @description
 * ประมวลผล LINE webhook events:
 * - message: ข้อความจากผู้ใช้
 * - postback: กดปุ่มใน Flex Message
 * - follow: เพิ่มเพื่อน
 * - unfollow: ยกเลิกเพื่อน
 */
exports.handleWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { events } = req.body;
    logger_1.logger.info('LINE Webhook received', { eventCount: events?.length });
    if (!events || !Array.isArray(events)) {
        res.status(400).json({ message: 'Invalid webhook data' });
        return;
    }
    // Log events
    await Promise.all(events.map((event) => {
        if (!prisma.lineEvent) {
            logger_1.logger.error('prisma.lineEvent is undefined!', {
                availableModels: Object.keys(prisma).filter(k => !k.startsWith('_'))
            });
            return Promise.resolve();
        }
        return prisma.lineEvent.create({
            data: {
                lineUserId: event.source?.userId || 'unknown',
                eventType: event.type,
                eventData: event,
            },
        });
    }));
    // Process events
    await Promise.all(events.map((event) => processLineEvent(event)));
    // LINE requires 200 OK response
    res.status(200).json({ message: 'OK' });
});
/**
 * Send Text Message to LINE User
 *
 * @route   POST /api/line/send-message
 * @access  Private (Admin only)
 */
exports.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { lineUserId, message } = req.body;
    logger_1.logger.info('Attempting to send LINE message', { lineUserId, messageLength: message?.length });
    const accessToken = process.env.LINE_ACCESS_TOKEN;
    if (!accessToken) {
        logger_1.logger.error('LINE_ACCESS_TOKEN is not configured');
        res.status(500).json({
            success: false,
            message: 'LINE_ACCESS_TOKEN is not configured',
        });
        return;
    }
    if (!lineUserId || !message) {
        res.status(400).json({
            success: false,
            message: 'lineUserId and message are required',
        });
        return;
    }
    try {
        logger_1.logger.info('Sending request to LINE API', {
            url: 'https://api.line.me/v2/bot/message/push',
            to: lineUserId,
        });
        const response = await axios_1.default.post('https://api.line.me/v2/bot/message/push', {
            to: lineUserId,
            messages: [{
                    type: 'text',
                    text: message,
                }],
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });
        logger_1.logger.info('LINE message sent successfully', {
            lineUserId,
            status: response.status,
            data: response.data,
        });
        res.json({
            success: true,
            message: 'Message sent successfully',
            data: response.data,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send LINE message', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            lineUserId,
        });
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Failed to send message',
            error: error.response?.data || error.message,
        });
    }
});
/**
 * Send Flex Message to LINE User
 *
 * @route   POST /api/line/send-flex
 * @access  Private (Admin only)
 */
exports.sendFlexMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { lineUserId, flexMessage } = req.body;
    const accessToken = process.env.LINE_ACCESS_TOKEN;
    if (!accessToken) {
        res.status(500).json({
            success: false,
            message: 'LINE_ACCESS_TOKEN is not configured',
        });
        return;
    }
    try {
        await axios_1.default.post('https://api.line.me/v2/bot/message/push', {
            to: lineUserId,
            messages: [{
                    type: 'flex',
                    altText: 'Message',
                    contents: flexMessage,
                }],
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });
        res.json({
            success: true,
            message: 'Flex message sent successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send LINE flex message', {
            error: error.message,
            response: error.response?.data,
            lineUserId,
        });
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Failed to send flex message',
            error: error.response?.data || error.message,
        });
    }
});
/**
 * Process LINE Event
 *
 * @param event - LINE webhook event
 *
 * @description
 * ประมวลผลแต่ละ event type:
 * - message: ประมวลผลคำสั่ง (ดูบิล, แจ้งซ่อม, etc.)
 * - postback: ประมวลผล action จาก Flex Message
 * - follow: บันทึก LINE user
 * - unfollow: อัพเดท LINE user status
 */
async function processLineEvent(event) {
    try {
        const { type, source, replyToken } = event;
        const lineUserId = source?.userId;
        if (!lineUserId) {
            logger_1.logger.warn('LINE event without userId', { type });
            return;
        }
        switch (type) {
            case 'message':
                await handleMessageEvent(event, lineUserId, replyToken);
                break;
            case 'postback':
                await handlePostbackEvent(event, lineUserId, replyToken);
                break;
            case 'follow':
                await handleFollowEvent(lineUserId);
                break;
            case 'unfollow':
                await handleUnfollowEvent(lineUserId);
                break;
            default:
                logger_1.logger.info(`Unhandled LINE event type: ${type}`);
        }
        // Mark event as processed
        await prisma.lineEvent.updateMany({
            where: {
                lineUserId,
                eventType: type,
                processed: false,
            },
            data: {
                processed: true,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing LINE event', {
            error: error.message,
            eventType: event.type,
        });
    }
}
/**
 * Handle Message Event
 *
 * @param event - LINE message event
 * @param lineUserId - LINE user ID
 * @param replyToken - Reply token for sending reply
 *
 * @description
 * ประมวลผลข้อความจากผู้ใช้:
 * - "ดูบิล" → ส่งรายการบิล
 * - "ค้างชำระ" → ส่งบิลค้างชำระ
 * - "แจ้งซ่อม" → เริ่มกระบวนการแจ้งซ่อม
 * - "ติดต่อแอดมิน" → สร้าง chat room
 */
async function handleMessageEvent(event, lineUserId, replyToken) {
    const message = event.message?.text;
    if (!message || typeof message !== 'string') {
        return;
    }
    // Find LINE user and tenant
    const lineUser = await prisma.lineUser.findUnique({
        where: { lineUserId },
        include: {
            tenant: {
                include: {
                    room: {
                        include: {
                            building: true,
                        },
                    },
                },
            },
        },
    });
    if (!lineUser || !lineUser.tenant) {
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: 'คุณยังไม่ได้เชื่อมต่อกับห้องพัก กรุณาติดต่อแอดมิน',
        });
        return;
    }
    const tenant = lineUser.tenant;
    // Process commands (Clean and Case-insensitive for English only)
    const cmd = message.trim();
    const cmdLower = cmd.toLowerCase();
    logger_1.logger.info('Checking command', {
        cmdLength: cmd.length,
        has_แจ้งซ่อม: cmd.includes('แจ้งซ่อม'),
        has_ซ่อม: cmd.includes('ซ่อม')
    });
    if (cmdLower === 'ดูบิล' || cmdLower === 'บิล' || cmdLower === 'bill') {
        await sendBillsList(tenant.id, replyToken);
    }
    else if (cmdLower === 'ค้างชำระ' || cmdLower === 'overdue') {
        await sendOverdueBills(tenant.id, replyToken);
    }
    else if (cmd.includes('แจ้งซ่อม') || cmd.includes('ซ่อม') || cmdLower === 'maintenance') {
        await handleMaintenanceMessage(message, tenant, replyToken);
    }
    else if (cmd === 'ติดต่อแอดมิน' || cmd === 'contact') {
        await sendContactAdminMessage(replyToken);
    }
    else if (cmd === 'เมนู' || cmd === 'menu') {
        await sendQuickReplyMenu(replyToken);
    }
    else {
        logger_1.logger.warn('Command not understood', { cmd });
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: 'ไม่เข้าใจคำสั่ง กรุณาใช้คำสั่ง: ดูบิล, ค้างชำระ, แจ้งซ่อม, ติดต่อแอดมิน',
        });
    }
}
/**
 * Handle Postback Event
 *
 * @param event - LINE postback event
 * @param lineUserId - LINE user ID
 * @param replyToken - Reply token
 *
 * @description
 * ประมวลผล postback จาก Flex Message buttons:
 * - action=view_bill&bill_id=xxx → แสดงรายละเอียดบิล
 * - action=list_bills → แสดงรายการบิล
 * - action=pay_bill&bill_id=xxx → ชำระเงิน
 */
async function handlePostbackEvent(event, lineUserId, replyToken) {
    const data = event.postback?.data;
    if (!data) {
        return;
    }
    // Parse postback data (format: "action=xxx&param=yyy")
    const params = new URLSearchParams(data);
    const action = params.get('action');
    const billId = params.get('bill_id');
    // Find LINE user and tenant
    const lineUser = await prisma.lineUser.findUnique({
        where: { lineUserId },
        include: {
            tenant: true,
        },
    });
    if (!lineUser || !lineUser.tenant) {
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: 'คุณยังไม่ได้เชื่อมต่อกับห้องพัก',
        });
        return;
    }
    switch (action) {
        case 'view_bill':
            if (billId) {
                await sendBillDetail(billId, replyToken);
            }
            break;
        case 'list_bills':
            await sendBillsList(lineUser.tenant.id, replyToken);
            break;
        case 'list_overdue':
            await sendOverdueBills(lineUser.tenant.id, replyToken);
            break;
        case 'pay_bill':
            if (billId) {
                await sendPaymentInfo(billId, replyToken);
            }
            break;
        case 'report_maintenance':
            await sendMaintenanceForm(replyToken);
            break;
        case 'contact_admin':
            await sendContactAdminMessage(replyToken);
            break;
        default:
            logger_1.logger.warn(`Unknown postback action: ${action}`);
    }
}
/**
 * Handle Follow Event
 *
 * @param lineUserId - LINE user ID
 *
 * @description
 * เมื่อผู้ใช้เพิ่มเพื่อน LINE Official Account
 * สร้างหรืออัพเดท LINE user record
 */
async function handleFollowEvent(lineUserId) {
    // Get user profile from LINE API
    const profile = await getLineUserProfile(lineUserId);
    // Create or update LINE user
    await prisma.lineUser.upsert({
        where: { lineUserId },
        create: {
            lineUserId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
        },
        update: {
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
        },
    });
    // Send welcome message
    // Note: Follow event doesn't have replyToken, need to use push message
    // This would be handled by notification service
}
/**
 * Handle Unfollow Event
 *
 * @param lineUserId - LINE user ID
 *
 * @description
 * เมื่อผู้ใช้ยกเลิกเพื่อน LINE Official Account
 * อัพเดท LINE user status
 */
async function handleUnfollowEvent(lineUserId) {
    // We don't have isActive, maybe just log it or remove the tenant connection if needed
    logger_1.logger.info(`User ${lineUserId} unfollowed the bot`);
}
/**
 * Send Bills List
 *
 * @param tenantId - Tenant ID
 * @param replyToken - Reply token
 *
 * @description
 * ส่ง Flex Message แสดงรายการบิลของผู้เช่า
 */
async function sendBillsList(tenantId, replyToken) {
    const bills = await prisma.bill.findMany({
        where: {
            tenantId,
            deletedAt: null,
        },
        include: {
            tenant: true, // Updated to match schema
        },
        orderBy: { billingMonth: 'desc' },
        take: 10,
    });
    if (bills.length === 0) {
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: 'ไม่มีบิลในระบบ',
        });
        return;
    }
    // Build Flex Message Carousel
    const flexMessages = bills.map((bill) => {
        const billingDate = new Date(bill.billingMonth);
        const totalAmount = Number(bill.totalAmount);
        const paidAmount = Number(bill.paidAmount);
        return (0, lineFlexMessage_service_1.buildFlexMessage)('bill_summary', {
            billId: bill.id,
            billNumber: bill.billNumber,
            billingMonth: billingDate,
            totalAmount,
            paidAmount,
            status: bill.status,
        });
    });
    await sendReplyMessage(replyToken, {
        type: 'flex',
        altText: 'รายการบิล',
        contents: {
            type: 'carousel',
            contents: flexMessages,
        },
    });
}
/**
 * Send Bill Detail
 *
 * @param billId - Bill ID
 * @param replyToken - Reply token
 *
 * @description
 * ส่ง Flex Message แสดงรายละเอียดบิล
 */
async function sendBillDetail(billId, replyToken) {
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: {
            tenant: true, // Updated to match schema
        },
    });
    if (!bill) {
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: 'ไม่พบบิล',
        });
        return;
    }
    const totalAmount = Number(bill.totalAmount);
    const paidAmount = Number(bill.paidAmount);
    const billingDate = new Date(bill.billingMonth);
    const flexMessage = (0, lineFlexMessage_service_1.buildFlexMessage)('bill_detail', {
        billId: bill.id,
        billNumber: bill.billNumber,
        billingMonth: billingDate,
        dueDate: bill.dueDate,
        items: [], // Bill model has fields directly, not items relation in this schema
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
        status: bill.status,
    });
    await sendReplyMessage(replyToken, {
        type: 'flex',
        altText: `บิล ${bill.billNumber}`,
        contents: flexMessage,
    });
}
/**
 * Send Overdue Bills
 *
 * @param tenantId - Tenant ID
 * @param replyToken - Reply token
 */
async function sendOverdueBills(tenantId, replyToken) {
    const bills = await prisma.bill.findMany({
        where: {
            tenantId,
            status: 'pending',
            dueDate: { lt: new Date() },
            deletedAt: null,
        },
        orderBy: { dueDate: 'asc' },
    });
    if (bills.length === 0) {
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: 'ไม่มีบิลค้างชำระ',
        });
        return;
    }
    // Send first overdue bill as Flex Message
    const bill = bills[0];
    const daysOverdue = Math.floor((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = Number(bill.totalAmount);
    const remainingAmount = bill.status === 'paid' ? 0 : totalAmount;
    const flexMessage = (0, lineFlexMessage_service_1.buildFlexMessage)('bill_overdue', {
        billId: bill.id,
        billNumber: bill.billNumber,
        remainingAmount,
        daysOverdue,
        dueDate: bill.dueDate,
    });
    await sendReplyMessage(replyToken, {
        type: 'flex',
        altText: 'บิลค้างชำระ',
        contents: flexMessage,
    });
}
/**
 * Send Maintenance Form
 *
 * @param replyToken - Reply token
 */
async function sendMaintenanceForm(replyToken) {
    await sendReplyMessage(replyToken, {
        type: 'text',
        text: 'กรุณาส่งข้อความตามรูปแบบนี้เพื่อแจ้งซ่อม:\n\nแจ้งซ่อม: [หัวข้อ] | [รายละเอียด] | [ประเภท] | [ความเร็ว]\n\nตัวอย่าง:\nแจ้งซ่อม: ก๊อกน้ำเสีย | ก๊อกน้ำในห้องน้ำรั่วไหลตลอดเวลา | ประปา | สูง\n\n*ประเภท: ไฟฟ้า, ประปา, โครงสร้าง, เครื่องใช้ไฟฟ้า, ทำความสะอาด, อื่นๆ\n*ความเร็ว: ต่ำ, กลาง, สูง, ด่วน',
    });
}
/**
 * Handle Maintenance message parsing and creation
 */
async function handleMaintenanceMessage(message, tenant, replyToken) {
    try {
        // Remove prefix (support "แจ้งซ่อม:", "แจ้งซ่อม ", "ซ่อม:")
        const content = message.replace(/^(แจ้งซ่อม|ซ่อม)[:\s]*/, '').trim();
        // Split by | or newline
        const parts = content.split(/[|\n]/).map(p => p.trim()).filter(p => p !== '');
        if (parts.length < 2) {
            // If they just typed "แจ้งซ่อม" without details, show the form
            if (content === '') {
                await sendMaintenanceForm(replyToken);
            }
            else {
                await sendReplyMessage(replyToken, {
                    type: 'text',
                    text: 'ข้อมูลไม่ครบถ้วน! กรุณาระบุอย่างน้อย "หัวข้อ" และ "รายละเอียด" โดยใช้เครื่องหมาย | หรือขึ้นบรรทัดใหม่คั่นครับ',
                });
            }
            return;
        }
        const title = parts[0];
        const description = parts[1];
        const categoryThai = parts[2] || 'อื่นๆ';
        const priorityThai = parts[3] || 'กลาง';
        // Map Category
        const categoryMap = {
            'ไฟฟ้า': 'electrical',
            'ประปา': 'plumbing',
            'โครงสร้าง': 'structural',
            'เครื่องใช้ไฟฟ้า': 'appliance',
            'ทำความสะอาด': 'cleaning',
            'อื่นๆ': 'other',
            'electrical': 'electrical',
            'plumbing': 'plumbing',
            'structural': 'structural',
            'appliance': 'appliance',
            'cleaning': 'cleaning',
            'other': 'other'
        };
        // Map Priority
        const priorityMap = {
            'ต่ำ': 'low',
            'กลาง': 'medium',
            'สูง': 'high',
            'ด่วน': 'urgent',
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'urgent'
        };
        const category = categoryMap[categoryThai] || 'other';
        const priority = priorityMap[priorityThai] || 'medium';
        const maintenanceRequest = await prisma.maintenanceRequest.create({
            data: {
                title,
                description,
                category,
                priority,
                tenantId: tenant.id,
                roomId: tenant.roomId,
                status: 'pending',
            }
        });
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: `✅ รับเรื่องแจ้งซ่อมเรียบร้อยแล้วครับ!\nหมายเลขแจ้งซ่อม: ${maintenanceRequest.id.substring(0, 8)}\nสถานะ: รอดำเนินการ\nเราจะรีบดำเนินการให้เร็วที่สุดครับ`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create maintenance request via LINE', error);
        await sendReplyMessage(replyToken, {
            type: 'text',
            text: '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง หรือติดต่อแอดมิน',
        });
    }
}
/**
 * Send Contact Admin Message
 *
 * @param replyToken - Reply token
 */
async function sendContactAdminMessage(replyToken) {
    await sendReplyMessage(replyToken, {
        type: 'text',
        text: 'กรุณาติดต่อแอดมินผ่านเว็บไซต์ หรือโทรศัพท์\nเว็บไซต์: https://dormitory.example.com/chat',
    });
}
/**
 * Send Quick Reply Menu
 *
 * @param replyToken - Reply token
 */
async function sendQuickReplyMenu(replyToken) {
    const flexMessage = (0, lineFlexMessage_service_1.buildFlexMessage)('quick_reply_menu', {});
    await sendReplyMessage(replyToken, {
        type: 'flex',
        altText: 'เมนูหลัก',
        contents: flexMessage,
    });
}
/**
 * Get Unlinked LINE Users
 *
 * @route   GET /api/line/unlinked-users
 * @access  Private (Admin only)
 */
exports.getUnlinkedLineUsers = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const unlinkedUsers = await prisma.lineUser.findMany({
        where: {
            tenant: null,
            // userId is not in LineUser model, so removing it
        },
        select: {
            lineUserId: true,
            displayName: true,
            pictureUrl: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    res.json({
        success: true,
        data: unlinkedUsers,
    });
});
/**
 * Send Payment Info
 *
 * @param billId - Bill ID
 * @param replyToken - Reply token
 */
async function sendPaymentInfo(_billId, replyToken) {
    await sendReplyMessage(replyToken, {
        type: 'text',
        text: 'กรุณาชำระเงินผ่าน:\n- โอนเงินเข้าบัญชี: XXX-XXX-XXXX\n- หรือชำระผ่านเว็บไซต์',
    });
}
/**
 * Send Reply Message via LINE API
 *
 * @param replyToken - Reply token
 * @param message - Message object
 */
async function sendReplyMessage(replyToken, message) {
    try {
        const accessToken = process.env.LINE_ACCESS_TOKEN;
        if (!accessToken) {
            logger_1.logger.error('LINE_ACCESS_TOKEN is not configured');
            return;
        }
        await axios_1.default.post('https://api.line.me/v2/bot/message/reply', {
            replyToken,
            messages: [message],
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send LINE reply message', {
            error: error.message,
            response: error.response?.data,
        });
    }
}
/**
 * Get LINE User Profile
 *
 * @param lineUserId - LINE user ID
 * @returns User profile
 */
async function getLineUserProfile(lineUserId) {
    try {
        const accessToken = process.env.LINE_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('LINE_ACCESS_TOKEN is not configured');
        }
        const response = await axios_1.default.get(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return {
            displayName: response.data.displayName,
            pictureUrl: response.data.pictureUrl,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get LINE user profile', { error: error.message });
        return {
            displayName: 'User',
        };
    }
}
//# sourceMappingURL=line.controller.js.map
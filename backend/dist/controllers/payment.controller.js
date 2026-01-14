"use strict";
/**
 * Payment Controller
 *
 * Controller functions สำหรับ payment management operations
 * ใช้ Transaction สำหรับ createPayment เพื่ออัพเดท bill status อัตโนมัติ
 *
 * @module server/src/controllers/payment.controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitTenantPayment = exports.rejectPayment = exports.approvePayment = exports.deletePayment = exports.createPayment = exports.getPaymentById = exports.getPayments = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const queue_1 = require("../jobs/queue");
const prisma = new client_1.PrismaClient();
/**
 * Get All Payments
 *
 * @route   GET /api/payments
 * @access  Private (Admin: all, Tenant: own payments)
 *
 * @param req - Express request (query: billId, tenantId, paymentDate, page, limit)
 * @param res - Express response
 */
exports.getPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { billId, tenantId, paymentDate, status, month, year, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        deletedAt: null,
    };
    // Tenant can only see own payments
    if (req.user?.role === 'tenant') {
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
                meta: {
                    total: 0,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: 0,
                },
            });
            return;
        }
    }
    else {
        // Admin can filter
        if (billId)
            where.billId = billId;
        if (tenantId)
            where.tenantId = tenantId;
        if (status && status !== 'all')
            where.status = status;
        // Month/Year filter for the bill
        if (month || year) {
            const filterMonth = month ? parseInt(month, 10) : null;
            const filterYear = year ? parseInt(year, 10) : new Date().getFullYear();
            const start = new Date(filterYear, filterMonth ? filterMonth - 1 : 0, 1);
            const end = new Date(filterYear, filterMonth ? filterMonth : 12, 0, 23, 59, 59, 999);
            where.bill = {
                billingMonth: {
                    gte: start,
                    lte: end,
                }
            };
        }
    }
    if (paymentDate) {
        const date = new Date(paymentDate);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        where.paymentDate = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }
    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: {
                bill: {
                    select: {
                        id: true,
                        billNumber: true,
                        billingMonth: true,
                        totalAmount: true,
                        tenant: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                        room: {
                            select: {
                                id: true,
                                roomNumber: true,
                                building: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: { paymentDate: 'desc' },
        }),
        prisma.payment.count({ where }),
    ]);
    // Transform data to match frontend expectations (Extract Month/Year from DateTime)
    const transformedPayments = payments.map((payment) => {
        if (!payment.bill)
            return payment;
        const billingDate = new Date(payment.bill.billingMonth);
        return {
            ...payment,
            bill: {
                ...payment.bill,
                billingMonth: billingDate.getMonth() + 1,
                billingYear: billingDate.getFullYear(),
            },
        };
    });
    res.json({
        success: true,
        data: transformedPayments,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Payment By ID
 *
 * @route   GET /api/payments/:id
 * @access  Private (Admin or own payment)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getPaymentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            bill: {
                include: {
                    items: true,
                },
            },
            tenant: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                },
            },
            verifier: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
    if (!payment || payment.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Payment not found',
        });
        return;
    }
    // Check authorization
    if (req.user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
            where: {
                userId: req.user.userId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (!tenant || tenant.id !== payment.tenantId) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
            return;
        }
    }
    res.json({
        success: true,
        data: { payment },
    });
});
/**
 * Create Payment (Transaction)
 *
 * @route   POST /api/payments
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: billId, tenantId, amount, paymentMethod, ...)
 * @param res - Express response
 *
 * @description
 * บันทึกการชำระเงินและอัพเดท bill status อัตโนมัติ
 * ใช้ Transaction เพื่อความปลอดภัยของข้อมูล
 */
exports.createPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { billId, tenantId, amount, paymentMethod, paymentDate, referenceNumber, receiptUrl, notes, } = req.body;
    // Check if bill exists
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
    });
    if (!bill || bill.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Bill not found',
        });
        return;
    }
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });
    if (!tenant || tenant.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Tenant not found',
        });
        return;
    }
    // Validate amount
    const paymentAmount = parseFloat(amount);
    const remainingAmount = Number(bill.totalAmount) - Number(bill.paidAmount);
    if (paymentAmount > remainingAmount) {
        res.status(400).json({
            success: false,
            message: `Payment amount exceeds remaining amount. Remaining: ${remainingAmount}`,
        });
        return;
    }
    // Use transaction to create payment and update bill
    const result = await prisma.$transaction(async (tx) => {
        // Create payment
        const payment = await tx.payment.create({
            data: {
                billId,
                tenantId,
                amount: paymentAmount,
                paymentMethod: paymentMethod,
                paymentDate: new Date(paymentDate),
                referenceNumber,
                receiptUrl,
                notes,
                status: 'pending', // Default
            },
        });
        // Update bill
        // If it's a bank transfer or promptpay with receipt, mark as 'verifying'
        const newStatus = (paymentMethod === 'bank_transfer' || paymentMethod === 'promptpay') && receiptUrl
            ? 'verifying'
            : bill.status;
        const updatedBill = await tx.bill.update({
            where: { id: billId },
            data: {
                status: newStatus,
            },
        });
        return { payment, bill: updatedBill };
    });
    logger_1.logger.info(`Payment recorded: ${result.payment.id}`, {
        paymentId: result.payment.id,
        billId,
        amount: paymentAmount,
    });
    res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: result,
    });
});
/**
 * Delete Payment (Soft Delete)
 *
 * @route   DELETE /api/payments/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 *
 * @description
 * Soft delete payment และอัพเดท bill status กลับ
 */
exports.deletePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Get payment with bill
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            bill: true,
        },
    });
    if (!payment || payment.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Payment not found',
        });
        return;
    }
    // Use transaction to delete payment and update bill
    await prisma.$transaction(async (tx) => {
        // Soft delete payment
        await tx.payment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        // Recalculate bill paid amount
        const remainingPayments = await tx.payment.findMany({
            where: {
                billId: payment.billId,
                deletedAt: null,
            },
        });
        const totalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingAmount = Number(payment.bill.totalAmount) - totalPaid;
        // Update bill
        await tx.bill.update({
            where: { id: payment.billId },
            data: {
                paidAmount: totalPaid,
                paidAt: totalPaid >= Number(payment.bill.totalAmount) ? new Date() : null,
                status: remainingAmount <= 0 ? 'paid' : 'pending',
            },
        });
    });
    logger_1.logger.info(`Payment deleted: ${id}`, {
        paymentId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Payment deleted successfully',
    });
});
/**
 * Approve Payment
 * @route   PUT /api/payments/:id/approve
 * @access  Private (Admin only)
 */
exports.approvePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: { bill: true }
    });
    if (!payment || payment.deletedAt) {
        res.status(404).json({ success: false, message: 'Payment not found' });
        return;
    }
    const result = await prisma.$transaction(async (tx) => {
        // 1. Update Payment status
        const updatedPayment = await tx.payment.update({
            where: { id },
            data: {
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: req.user?.userId
            }
        });
        // 2. Update Bill totals
        const newPaidAmount = Number(payment.bill.paidAmount) + Number(payment.amount);
        const isFullyPaid = newPaidAmount >= Number(payment.bill.totalAmount);
        const updatedBill = await tx.bill.update({
            where: { id: payment.billId },
            data: {
                paidAmount: newPaidAmount,
                paidAt: isFullyPaid ? new Date() : payment.bill.paidAt,
                status: isFullyPaid ? 'paid' : 'pending' // If not fully paid, back to pending
            }
        });
        return { payment: updatedPayment, bill: updatedBill };
    });
    // Send LINE notification
    try {
        await queue_1.notificationQueue.add('send-line-notification', {
            tenantId: payment.tenantId,
            title: 'อนุมัติการชำระเงินเรียบร้อยแล้ว',
            message: `ยอดชำระจำนวน ${Number(payment.amount).toLocaleString()} บาท สำหรับบิล ${payment.bill.billNumber} ได้รับการอนุมัติแล้ว ขอบคุณครับ`,
            notificationType: client_1.NotificationType.payment_approved
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to queue payment approval notification:', error);
    }
    res.json({
        success: true,
        message: 'Payment approved successfully',
        data: result
    });
});
/**
 * Reject Payment
 * @route   PUT /api/payments/:id/reject
 * @access  Private (Admin only)
 */
exports.rejectPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: { bill: true }
    });
    if (!payment || payment.deletedAt) {
        res.status(404).json({ success: false, message: 'Payment not found' });
        return;
    }
    const result = await prisma.$transaction(async (tx) => {
        // 1. Update Payment status
        const updatedPayment = await tx.payment.update({
            where: { id },
            data: {
                status: 'rejected',
                notes: reason ? `${payment.notes || ''}\nReject Reason: ${reason}` : payment.notes
            }
        });
        // 2. Update Bill status back if was verifying
        if (payment.bill.status === 'verifying') {
            await tx.bill.update({
                where: { id: payment.billId },
                data: { status: 'pending' }
            });
        }
        return { payment: updatedPayment };
    });
    // Send LINE notification
    try {
        await queue_1.notificationQueue.add('send-line-notification', {
            tenantId: payment.tenantId,
            title: 'การชำระเงินถูกปฏิเสธ',
            message: `แจ้งเตือน: การชำระเงินสำหรับบิล ${payment.bill.billNumber} ถูกปฏิเสธ${reason ? ` เนื่องจาก: ${reason}` : ''} กรุณาตรวจสอบและดำเนินการใหม่อีกครั้ง`,
            notificationType: client_1.NotificationType.payment_rejected
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to queue payment rejection notification:', error);
    }
    res.json({
        success: true,
        message: 'Payment rejected',
        data: result
    });
});
/**
 * Submit Tenant Payment
 * @route   POST /api/tenant/payments
 * @access  Private (Tenant only)
 *
 * @description
 * บันทึกหลักฐานการชำระเงินจากผู้เช่า และเปลี่ยนสถานะบิลเป็น 'verifying'
 */
exports.submitTenantPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { billId, amount, paymentMethod, paymentDate, referenceNumber, receiptUrl, notes, } = req.body;
    // 1. Get tenant info for this user
    const tenant = await prisma.tenant.findFirst({
        where: {
            userId: req.user?.userId,
            deletedAt: null,
        },
    });
    if (!tenant) {
        res.status(404).json({
            success: false,
            message: 'Tenant profile not found for this user',
        });
        return;
    }
    // 2. Check if bill exists and belongs to this tenant
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
    });
    if (!bill || bill.tenantId !== tenant.id) {
        res.status(404).json({
            success: false,
            message: 'Bill not found or does not belong to you',
        });
        return;
    }
    if (bill.status === 'paid') {
        res.status(400).json({
            success: false,
            message: 'This bill is already paid',
        });
        return;
    }
    const paymentAmount = parseFloat(amount);
    // 3. Create payment and update bill status to 'verifying'
    const result = await prisma.$transaction(async (tx) => {
        // Create payment record with 'pending' status
        const payment = await tx.payment.create({
            data: {
                billId,
                tenantId: tenant.id,
                amount: paymentAmount,
                paymentMethod,
                paymentDate: new Date(paymentDate),
                referenceNumber,
                receiptUrl,
                notes,
                status: 'pending', // Waiting for admin approval
            },
        });
        // Update bill status to 'verifying'
        const updatedBill = await tx.bill.update({
            where: { id: billId },
            data: { status: 'verifying' },
        });
        return { payment, bill: updatedBill };
    });
    logger_1.logger.info(`Tenant submitted payment for bill ${bill.billNumber}`, {
        tenantId: tenant.id,
        billId,
        paymentId: result.payment.id,
    });
    res.status(201).json({
        success: true,
        message: 'Payment submission received. Waiting for verification.',
        data: result,
    });
});
//# sourceMappingURL=payment.controller.js.map
/**
 * Payment Controller
 *
 * Controller functions สำหรับ payment management operations
 * ใช้ Transaction สำหรับ createPayment เพื่ออัพเดท bill status อัตโนมัติ
 *
 * @module server/src/controllers/payment.controller
 */
import { Response } from 'express';
/**
 * Get All Payments
 *
 * @route   GET /api/payments
 * @access  Private (Admin: all, Tenant: own payments)
 *
 * @param req - Express request (query: billId, tenantId, paymentDate, page, limit)
 * @param res - Express response
 */
export declare const getPayments: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Payment By ID
 *
 * @route   GET /api/payments/:id
 * @access  Private (Admin or own payment)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getPaymentById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
export declare const createPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
export declare const deletePayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Approve Payment
 * @route   PUT /api/payments/:id/approve
 * @access  Private (Admin only)
 */
export declare const approvePayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Reject Payment
 * @route   PUT /api/payments/:id/reject
 * @access  Private (Admin only)
 */
export declare const rejectPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Submit Tenant Payment
 * @route   POST /api/tenant/payments
 * @access  Private (Tenant only)
 *
 * @description
 * บันทึกหลักฐานการชำระเงินจากผู้เช่า และเปลี่ยนสถานะบิลเป็น 'verifying'
 */
export declare const submitTenantPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=payment.controller.d.ts.map
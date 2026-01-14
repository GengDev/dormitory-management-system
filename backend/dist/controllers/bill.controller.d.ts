/**
 * Bill Controller
 *
 * Controller functions สำหรับ bill management operations
 * ใช้ Transaction สำหรับ createBill เพื่อความปลอดภัยของข้อมูล
 *
 * @module server/src/controllers/bill.controller
 */
import { Response } from 'express';
/**
 * Get All Bills
 *
 * @route   GET /api/bills
 * @access  Private (Admin: all, Tenant: own bills)
 *
 * @param req - Express request (query: tenantId, roomId, status, billingMonth, overdue, page, limit)
 * @param res - Express response
 */
export declare const getBills: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Bill By ID
 *
 * @route   GET /api/bills/:id
 * @access  Private (Admin or own bill)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export declare const getBillById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Bill with Items (Transaction)
 *
 * @route   POST /api/bills
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: tenantId, roomId, billingMonth, dueDate, items[], notes?)
 * @param res - Express response
 *
 * @description
 * สร้างบิลพร้อมรายการย่อยใน Transaction เพื่อความปลอดภัยของข้อมูล
 * ถ้าสร้างบิลสำเร็จ แต่สร้าง items ล้มเหลว จะ rollback ทั้งหมด
 */
export declare const createBill: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update Bill Status
 *
 * @route   PUT /api/bills/:id/status
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: status)
 * @param res - Express response
 */
export declare const updateBillStatus: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Overdue Bills
 *
 * @route   GET /api/bills/overdue
 * @access  Private (Admin only)
 *
 * @param req - Express request
 * @param res - Express response
 */
export declare const getOverdueBills: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Generate Monthly Bills for All Active Tenants
 *
 * @route   POST /api/bills/generate-monthly
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: billingMonth, dueDate)
 * @param res - Express response
 *
 * @description
 * สร้างบิลให้ผู้เช่าทุกคนที่ active ในเดือนที่กำหนด
 * ใช้ Queue สำหรับ background processing
 */
export declare const generateMonthlyBills: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=bill.controller.d.ts.map
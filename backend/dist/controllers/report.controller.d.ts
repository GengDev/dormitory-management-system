/**
 * Report Controller
 *
 * Controller functions สำหรับ reports และ analytics
 *
 * @module server/src/controllers/report.controller
 */
import { Response } from 'express';
/**
 * Get Occupancy Report
 *
 * @route   GET /api/reports/occupancy
 * @access  Private (Admin only)
 *
 * @param req - Express request
 * @param res - Express response
 */
export declare const getOccupancyReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Revenue Report
 *
 * @route   GET /api/reports/revenue
 * @access  Private (Admin only)
 *
 * @param req - Express request (query: startDate, endDate, groupBy)
 * @param res - Express response
 */
export declare const getRevenueReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get Overdue Summary
 *
 * @route   GET /api/reports/overdue-summary
 * @access  Private (Admin only)
 *
 * @param req - Express request
 * @param res - Express response
 */
export declare const getOverdueSummary: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Export Occupancy Report as CSV
 */
export declare const exportOccupancyReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Export Revenue Report as CSV
 */
export declare const exportRevenueReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Export Overdue Report as CSV
 */
export declare const exportOverdueReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=report.controller.d.ts.map
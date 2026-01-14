/**
 * Notification Controller
 *
 * Controller สำหรับจัดการ notifications และส่งแจ้งเตือน
 *
 * @module server/src/controllers/notification.controller
 */
import { Response } from 'express';
/**
 * Get All Notifications
 */
export declare const getNotifications: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create Notification (Internal)
 */
export declare const createNotification: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Send Bill Notification
 */
export declare const sendBillNotification: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Send Maintenance Notification
 */
export declare const sendMaintenanceNotification: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Send Custom Notification
 */
export declare const sendCustomNotification: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=notification.controller.d.ts.map
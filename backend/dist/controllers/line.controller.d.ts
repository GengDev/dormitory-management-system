/**
 * LINE Controller
 *
 * Controller สำหรับจัดการ LINE webhook events และส่ง Flex Messages
 *
 * @module server/src/controllers/line.controller
 */
import { Request, Response, NextFunction } from 'express';
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
export declare const verifySignature: (req: Request, res: Response, next: NextFunction) => void;
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
export declare const handleWebhook: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Send Text Message to LINE User
 *
 * @route   POST /api/line/send-message
 * @access  Private (Admin only)
 */
export declare const sendMessage: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Send Flex Message to LINE User
 *
 * @route   POST /api/line/send-flex
 * @access  Private (Admin only)
 */
export declare const sendFlexMessage: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get Unlinked LINE Users
 *
 * @route   GET /api/line/unlinked-users
 * @access  Private (Admin only)
 */
export declare const getUnlinkedLineUsers: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=line.controller.d.ts.map
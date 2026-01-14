/**
 * Validation Middleware
 *
 * Middleware สำหรับ validate request body/query/params
 * ใช้ร่วมกับ express-validator
 *
 * @module server/src/middleware/validate.middleware
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Validate Request Middleware
 *
 * Checks validation results และ return errors ถ้ามี
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.middleware.d.ts.map
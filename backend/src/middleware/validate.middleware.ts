/**
 * Validation Middleware
 * 
 * Middleware สำหรับ validate request body/query/params
 * ใช้ร่วมกับ express-validator
 * 
 * @module server/src/middleware/validate.middleware
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Validate Request Middleware
 * 
 * Checks validation results และ return errors ถ้ามี
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
    return;
  }

  next();
};


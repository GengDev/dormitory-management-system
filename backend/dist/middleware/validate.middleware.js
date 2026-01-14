"use strict";
/**
 * Validation Middleware
 *
 * Middleware สำหรับ validate request body/query/params
 * ใช้ร่วมกับ express-validator
 *
 * @module server/src/middleware/validate.middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validate Request Middleware
 *
 * Checks validation results และ return errors ถ้ามี
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
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
exports.validateRequest = validateRequest;
//# sourceMappingURL=validate.middleware.js.map
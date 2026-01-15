"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceValidations = exports.roomValidations = exports.tenantValidations = exports.paymentValidations = exports.billValidations = exports.authValidations = exports.commonValidations = void 0;
exports.validate = validate;
exports.sanitizeInput = sanitizeInput;
exports.sanitizeBody = sanitizeBody;
exports.sanitizeQuery = sanitizeQuery;
exports.sanitizeAll = sanitizeAll;
const express_validator_1 = require("express-validator");
const errors_1 = require("../utils/errors");
/**
 * Validation Middleware
 * Checks for validation errors from express-validator
 */
function validate(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errors_1.ValidationError('Validation failed', errors.array());
    }
    next();
}
/**
 * Sanitize input to prevent XSS attacks
 */
function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const key in input) {
            sanitized[key] = sanitizeInput(input[key]);
        }
        return sanitized;
    }
    return input;
}
/**
 * Sanitize Request Body Middleware
 */
function sanitizeBody(req, res, next) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    next();
}
/**
 * Sanitize Query Parameters Middleware
 */
function sanitizeQuery(req, res, next) {
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    next();
}
/**
 * Sanitize All Inputs Middleware
 */
function sanitizeAll(req, res, next) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
}
/**
 * Common Validation Schemas
 */
const express_validator_2 = require("express-validator");
exports.commonValidations = {
    // ID validation
    id: (0, express_validator_2.param)('id').isUUID().withMessage('Invalid ID format'),
    // Email validation
    email: (0, express_validator_2.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    // Password validation
    password: (0, express_validator_2.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    // Phone validation (Thai format)
    phone: (0, express_validator_2.body)('phone')
        .matches(/^0[0-9]{9}$/)
        .withMessage('Invalid phone number format'),
    // Pagination
    page: (0, express_validator_2.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    limit: (0, express_validator_2.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    // Date validation
    date: (0, express_validator_2.body)('date')
        .isISO8601()
        .withMessage('Invalid date format'),
    // Amount validation
    amount: (0, express_validator_2.body)('amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
};
/**
 * Auth Validation Schemas
 */
exports.authValidations = {
    register: [
        (0, express_validator_2.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_2.body)('password').isLength({ min: 8 }),
        (0, express_validator_2.body)('fullName').notEmpty().trim(),
        (0, express_validator_2.body)('phone').matches(/^0[0-9]{9}$/),
    ],
    login: [
        (0, express_validator_2.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_2.body)('password').notEmpty(),
    ],
    resetPassword: [
        (0, express_validator_2.body)('email').isEmail().normalizeEmail(),
    ],
    changePassword: [
        (0, express_validator_2.body)('currentPassword').notEmpty(),
        (0, express_validator_2.body)('newPassword').isLength({ min: 8 }),
    ],
};
/**
 * Bill Validation Schemas
 */
exports.billValidations = {
    create: [
        (0, express_validator_2.body)('tenantId').isUUID(),
        (0, express_validator_2.body)('roomId').isUUID(),
        (0, express_validator_2.body)('billingMonth').isISO8601(),
        (0, express_validator_2.body)('dueDate').isISO8601(),
        (0, express_validator_2.body)('rentAmount').isFloat({ min: 0 }),
        (0, express_validator_2.body)('waterUsage').optional().isFloat({ min: 0 }),
        (0, express_validator_2.body)('electricityUsage').optional().isFloat({ min: 0 }),
    ],
    update: [
        (0, express_validator_2.param)('id').isUUID(),
        (0, express_validator_2.body)('status').optional().isIn(['pending', 'verifying', 'paid', 'overdue', 'cancelled']),
        (0, express_validator_2.body)('paidAmount').optional().isFloat({ min: 0 }),
    ],
};
/**
 * Payment Validation Schemas
 */
exports.paymentValidations = {
    create: [
        (0, express_validator_2.body)('billId').isUUID(),
        (0, express_validator_2.body)('amount').isFloat({ min: 0 }),
        (0, express_validator_2.body)('paymentMethod').isIn(['cash', 'bank_transfer', 'promptpay', 'credit_card']),
        (0, express_validator_2.body)('paymentDate').isISO8601(),
    ],
    approve: [
        (0, express_validator_2.param)('id').isUUID(),
        (0, express_validator_2.body)('status').isIn(['approved', 'rejected']),
        (0, express_validator_2.body)('notes').optional().isString(),
    ],
};
/**
 * Tenant Validation Schemas
 */
exports.tenantValidations = {
    create: [
        (0, express_validator_2.body)('fullName').notEmpty().trim(),
        (0, express_validator_2.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_2.body)('phone').matches(/^0[0-9]{9}$/),
        (0, express_validator_2.body)('idCardNumber').matches(/^[0-9]{13}$/),
        (0, express_validator_2.body)('roomId').optional().isUUID(),
    ],
    update: [
        (0, express_validator_2.param)('id').isUUID(),
        (0, express_validator_2.body)('fullName').optional().notEmpty().trim(),
        (0, express_validator_2.body)('email').optional().isEmail().normalizeEmail(),
        (0, express_validator_2.body)('phone').optional().matches(/^0[0-9]{9}$/),
        (0, express_validator_2.body)('status').optional().isIn(['active', 'inactive', 'moved_out']),
    ],
};
/**
 * Room Validation Schemas
 */
exports.roomValidations = {
    create: [
        (0, express_validator_2.body)('buildingId').isUUID(),
        (0, express_validator_2.body)('roomNumber').notEmpty().trim(),
        (0, express_validator_2.body)('floorNumber').isInt({ min: 1 }),
        (0, express_validator_2.body)('roomType').isIn(['single', 'double', 'suite', 'studio']),
        (0, express_validator_2.body)('monthlyRent').isFloat({ min: 0 }),
        (0, express_validator_2.body)('deposit').optional().isFloat({ min: 0 }),
    ],
    update: [
        (0, express_validator_2.param)('id').isUUID(),
        (0, express_validator_2.body)('status').optional().isIn(['available', 'occupied', 'maintenance']),
        (0, express_validator_2.body)('monthlyRent').optional().isFloat({ min: 0 }),
    ],
};
/**
 * Maintenance Validation Schemas
 */
exports.maintenanceValidations = {
    create: [
        (0, express_validator_2.body)('tenantId').isUUID(),
        (0, express_validator_2.body)('roomId').isUUID(),
        (0, express_validator_2.body)('title').notEmpty().trim(),
        (0, express_validator_2.body)('description').notEmpty().trim(),
        (0, express_validator_2.body)('category').isIn(['electrical', 'plumbing', 'structural', 'appliance', 'cleaning', 'other']),
        (0, express_validator_2.body)('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    ],
    update: [
        (0, express_validator_2.param)('id').isUUID(),
        (0, express_validator_2.body)('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
        (0, express_validator_2.body)('assignedTo').optional().isString(),
        (0, express_validator_2.body)('estimatedCost').optional().isFloat({ min: 0 }),
        (0, express_validator_2.body)('actualCost').optional().isFloat({ min: 0 }),
    ],
};
//# sourceMappingURL=validation.js.map
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Validation Middleware
 * Checks for validation errors from express-validator
 */
export function validate(req: Request, _res: Response, next: NextFunction) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    next();
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: any): any {
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
        const sanitized: any = {};
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
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    next();
}

/**
 * Sanitize Query Parameters Middleware
 */
export function sanitizeQuery(req: Request, _res: Response, next: NextFunction) {
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    next();
}

/**
 * Sanitize All Inputs Middleware
 */
export function sanitizeAll(req: Request, _res: Response, next: NextFunction) {
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
import { body, param, query } from 'express-validator';

export const commonValidations = {
    // ID validation
    id: param('id').isUUID().withMessage('Invalid ID format'),

    // Email validation
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),

    // Password validation
    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),

    // Phone validation (Thai format)
    phone: body('phone')
        .matches(/^0[0-9]{9}$/)
        .withMessage('Invalid phone number format'),

    // Pagination
    page: query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    limit: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    // Date validation
    date: body('date')
        .isISO8601()
        .withMessage('Invalid date format'),

    // Amount validation
    amount: body('amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
};

/**
 * Auth Validation Schemas
 */
export const authValidations = {
    register: [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('fullName').notEmpty().trim(),
        body('phone').matches(/^0[0-9]{9}$/),
    ],

    login: [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],

    resetPassword: [
        body('email').isEmail().normalizeEmail(),
    ],

    changePassword: [
        body('currentPassword').notEmpty(),
        body('newPassword').isLength({ min: 8 }),
    ],
};

/**
 * Bill Validation Schemas
 */
export const billValidations = {
    create: [
        body('tenantId').isUUID(),
        body('roomId').isUUID(),
        body('billingMonth').isISO8601(),
        body('dueDate').isISO8601(),
        body('rentAmount').isFloat({ min: 0 }),
        body('waterUsage').optional().isFloat({ min: 0 }),
        body('electricityUsage').optional().isFloat({ min: 0 }),
    ],

    update: [
        param('id').isUUID(),
        body('status').optional().isIn(['pending', 'verifying', 'paid', 'overdue', 'cancelled']),
        body('paidAmount').optional().isFloat({ min: 0 }),
    ],
};

/**
 * Payment Validation Schemas
 */
export const paymentValidations = {
    create: [
        body('billId').isUUID(),
        body('amount').isFloat({ min: 0 }),
        body('paymentMethod').isIn(['cash', 'bank_transfer', 'promptpay', 'credit_card']),
        body('paymentDate').isISO8601(),
    ],

    approve: [
        param('id').isUUID(),
        body('status').isIn(['approved', 'rejected']),
        body('notes').optional().isString(),
    ],
};

/**
 * Tenant Validation Schemas
 */
export const tenantValidations = {
    create: [
        body('fullName').notEmpty().trim(),
        body('email').isEmail().normalizeEmail(),
        body('phone').matches(/^0[0-9]{9}$/),
        body('idCardNumber').matches(/^[0-9]{13}$/),
        body('roomId').optional().isUUID(),
    ],

    update: [
        param('id').isUUID(),
        body('fullName').optional().notEmpty().trim(),
        body('email').optional().isEmail().normalizeEmail(),
        body('phone').optional().matches(/^0[0-9]{9}$/),
        body('status').optional().isIn(['active', 'inactive', 'moved_out']),
    ],
};

/**
 * Room Validation Schemas
 */
export const roomValidations = {
    create: [
        body('buildingId').isUUID(),
        body('roomNumber').notEmpty().trim(),
        body('floorNumber').isInt({ min: 1 }),
        body('roomType').isIn(['single', 'double', 'suite', 'studio']),
        body('monthlyRent').isFloat({ min: 0 }),
        body('deposit').optional().isFloat({ min: 0 }),
    ],

    update: [
        param('id').isUUID(),
        body('status').optional().isIn(['available', 'occupied', 'maintenance']),
        body('monthlyRent').optional().isFloat({ min: 0 }),
    ],
};

/**
 * Maintenance Validation Schemas
 */
export const maintenanceValidations = {
    create: [
        body('tenantId').isUUID(),
        body('roomId').isUUID(),
        body('title').notEmpty().trim(),
        body('description').notEmpty().trim(),
        body('category').isIn(['electrical', 'plumbing', 'structural', 'appliance', 'cleaning', 'other']),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    ],

    update: [
        param('id').isUUID(),
        body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
        body('assignedTo').optional().isString(),
        body('estimatedCost').optional().isFloat({ min: 0 }),
        body('actualCost').optional().isFloat({ min: 0 }),
    ],
};

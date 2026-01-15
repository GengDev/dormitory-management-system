import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Validation Middleware
 * Checks for validation errors from express-validator
 */
export declare function validate(req: Request, res: Response, next: NextFunction): void;
/**
 * Sanitize input to prevent XSS attacks
 */
export declare function sanitizeInput(input: any): any;
/**
 * Sanitize Request Body Middleware
 */
export declare function sanitizeBody(req: Request, res: Response, next: NextFunction): void;
/**
 * Sanitize Query Parameters Middleware
 */
export declare function sanitizeQuery(req: Request, res: Response, next: NextFunction): void;
/**
 * Sanitize All Inputs Middleware
 */
export declare function sanitizeAll(req: Request, res: Response, next: NextFunction): void;
export declare const commonValidations: {
    id: ValidationChain;
    email: ValidationChain;
    password: ValidationChain;
    phone: ValidationChain;
    page: ValidationChain;
    limit: ValidationChain;
    date: ValidationChain;
    amount: ValidationChain;
};
/**
 * Auth Validation Schemas
 */
export declare const authValidations: {
    register: ValidationChain[];
    login: ValidationChain[];
    resetPassword: ValidationChain[];
    changePassword: ValidationChain[];
};
/**
 * Bill Validation Schemas
 */
export declare const billValidations: {
    create: ValidationChain[];
    update: ValidationChain[];
};
/**
 * Payment Validation Schemas
 */
export declare const paymentValidations: {
    create: ValidationChain[];
    approve: ValidationChain[];
};
/**
 * Tenant Validation Schemas
 */
export declare const tenantValidations: {
    create: ValidationChain[];
    update: ValidationChain[];
};
/**
 * Room Validation Schemas
 */
export declare const roomValidations: {
    create: ValidationChain[];
    update: ValidationChain[];
};
/**
 * Maintenance Validation Schemas
 */
export declare const maintenanceValidations: {
    create: ValidationChain[];
    update: ValidationChain[];
};
//# sourceMappingURL=validation.d.ts.map
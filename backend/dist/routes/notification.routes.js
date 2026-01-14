"use strict";
/**
 * Notification Routes
 *
 * Routes สำหรับจัดการ notifications และส่งแจ้งเตือน
 *
 * @module server/src/routes/notification.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/notifications
 * @desc    Get all notifications (Admin: all, Tenant: own)
 * @access  Private
 * @query   tenantId, type, status, page, limit
 */
router.get('/', auth_middleware_1.authenticate, notification_controller_1.getNotifications);
/**
 * @route   POST /api/notifications
 * @desc    Create notification (internal use)
 * @access  Private (Admin only)
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), validate_middleware_1.validateRequest, notification_controller_1.createNotification);
/**
 * @route   POST /api/notifications/send-bill
 * @desc    Send bill notification to tenant
 * @access  Private (Admin only)
 * @body    { billId, tenantId }
 */
router.post('/send-bill', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('billId').isUUID().withMessage('Bill ID must be a valid UUID'),
    (0, express_validator_1.body)('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
], validate_middleware_1.validateRequest, notification_controller_1.sendBillNotification);
/**
 * @route   POST /api/notifications/send-maintenance
 * @desc    Send maintenance update notification
 * @access  Private (Admin only)
 * @body    { maintenanceId, tenantId, message }
 */
router.post('/send-maintenance', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('maintenanceId').isUUID().withMessage('Maintenance ID must be a valid UUID'),
    (0, express_validator_1.body)('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message is required'),
], validate_middleware_1.validateRequest, notification_controller_1.sendMaintenanceNotification);
/**
 * @route   POST /api/notifications/send-custom
 * @desc    Send custom notification
 * @access  Private (Admin only)
 * @body    { tenantId, title, message, type }
 */
router.post('/send-custom', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('tenantId').isUUID().withMessage('Tenant ID must be a valid UUID'),
    (0, express_validator_1.body)('title').trim().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
], validate_middleware_1.validateRequest, notification_controller_1.sendCustomNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map
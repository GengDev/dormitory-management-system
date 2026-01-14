"use strict";
/**
 * LINE Webhook Routes
 *
 * Routes สำหรับรับ LINE webhook events
 *
 * @module server/src/routes/line.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const line_controller_1 = require("../controllers/line.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/line/webhook
 * @desc    LINE webhook endpoint (no auth, uses signature verification)
 * @access  Public (verified by LINE signature)
 *
 * @description
 * รับ events จาก LINE Platform
 * ตรวจสอบ signature ก่อนประมวลผล
 */
router.post('/webhook', line_controller_1.verifySignature, line_controller_1.handleWebhook);
/**
 * @route   GET /api/line/webhook
 * @desc    Check webhook status
 * @access  Public
 */
router.get('/webhook', (_req, res) => {
    res.json({
        success: true,
        message: 'LINE Webhook is active. Please use POST method to send events.',
    });
});
/**
 * @route   POST /api/line/send-message
 * @desc    Send text message to LINE user
 * @access  Private (Admin only)
 * @body    { lineUserId, message }
 */
router.post('/send-message', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('lineUserId')
        .trim()
        .notEmpty()
        .withMessage('LINE User ID is required')
        .matches(/^U[0-9a-f]{32}$/)
        .withMessage('LINE User ID must be a valid LINE user ID (starts with U followed by 32 hex characters)'),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message is required'),
], validate_middleware_1.validateRequest, line_controller_1.sendMessage);
/**
 * @route   POST /api/line/send-flex
 * @desc    Send flex message to LINE user
 * @access  Private (Admin only)
 * @body    { lineUserId, flexMessage }
 */
router.post('/send-flex', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), [
    (0, express_validator_1.body)('lineUserId')
        .trim()
        .notEmpty()
        .withMessage('LINE User ID is required')
        .matches(/^U[0-9a-f]{32}$/)
        .withMessage('LINE User ID must be a valid LINE user ID (starts with U followed by 32 hex characters)'),
    (0, express_validator_1.body)('flexMessage').isObject().withMessage('Flex message must be a valid object'),
], validate_middleware_1.validateRequest, line_controller_1.sendFlexMessage);
/**
 * @route   GET /api/line/unlinked-users
 * @desc    Get all unlinked LINE users
 * @access  Private (Admin only)
 */
router.get('/unlinked-users', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), line_controller_1.getUnlinkedLineUsers);
exports.default = router;
//# sourceMappingURL=line.routes.js.map
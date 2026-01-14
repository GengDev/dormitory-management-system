/**
 * LINE Webhook Routes
 * 
 * Routes สำหรับรับ LINE webhook events
 * 
 * @module server/src/routes/line.routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { handleWebhook, verifySignature, sendMessage, sendFlexMessage, getUnlinkedLineUsers } from '../controllers/line.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

/**
 * @route   POST /api/line/webhook
 * @desc    LINE webhook endpoint (no auth, uses signature verification)
 * @access  Public (verified by LINE signature)
 *
 * @description
 * รับ events จาก LINE Platform
 * ตรวจสอบ signature ก่อนประมวลผล
 */
router.post('/webhook', verifySignature, handleWebhook);

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
router.post(
  '/send-message',
  authenticate,
  authorize(['admin']),
  [
    body('lineUserId')
      .trim()
      .notEmpty()
      .withMessage('LINE User ID is required')
      .matches(/^U[0-9a-f]{32}$/)
      .withMessage('LINE User ID must be a valid LINE user ID (starts with U followed by 32 hex characters)'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validateRequest,
  sendMessage
);

/**
 * @route   POST /api/line/send-flex
 * @desc    Send flex message to LINE user
 * @access  Private (Admin only)
 * @body    { lineUserId, flexMessage }
 */
router.post(
  '/send-flex',
  authenticate,
  authorize(['admin']),
  [
    body('lineUserId')
      .trim()
      .notEmpty()
      .withMessage('LINE User ID is required')
      .matches(/^U[0-9a-f]{32}$/)
      .withMessage('LINE User ID must be a valid LINE user ID (starts with U followed by 32 hex characters)'),
    body('flexMessage').isObject().withMessage('Flex message must be a valid object'),
  ],
  validateRequest,
  sendFlexMessage
);

/**
 * @route   GET /api/line/unlinked-users
 * @desc    Get all unlinked LINE users
 * @access  Private (Admin only)
 */
router.get('/unlinked-users', authenticate, authorize(['admin']), getUnlinkedLineUsers);

export default router;


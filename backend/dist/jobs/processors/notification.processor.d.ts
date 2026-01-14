/**
 * Notification Job Processor
 *
 * Process notification jobs สำหรับส่ง LINE notifications
 *
 * @module server/src/jobs/processors/notification.processor
 */
/**
 * Process Notification Job
 *
 * @param data - Job data { tenantId, billId?, notificationType, ... }
 * @returns Processing result
 *
 * @description
 * ส่ง LINE notification ไปยังผู้เช่า
 * รองรับหลาย notification types:
 * - bill_due: แจ้งเตือนบิลใกล้ครบกำหนด
 * - bill_overdue: แจ้งเตือนบิลค้างชำระ
 * - payment_confirmed: ยืนยันการชำระเงิน
 * - maintenance_update: อัพเดทสถานะแจ้งซ่อม
 */
export declare function processNotificationJob(data: {
    tenantId: string;
    billId?: string;
    notificationType: string;
    [key: string]: any;
}): Promise<{
    success: boolean;
    messageId?: string;
}>;
//# sourceMappingURL=notification.processor.d.ts.map
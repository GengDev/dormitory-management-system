/**
 * LINE Flex Message Service
 *
 * Service สำหรับสร้าง LINE Flex Message templates
 *
 * @module server/src/services/lineFlexMessage.service
 */
/**
 * Build Flex Message from Template
 *
 * @param template - Template name (bill_notification, bill_detail, bill_overdue, etc.)
 * @param data - Data to fill in template
 * @returns Flex Message object
 *
 * @description
 * สร้าง Flex Message จาก template และ data
 * แทนที่ placeholders ใน template ด้วยข้อมูลจริง
 */
export declare function buildFlexMessage(template: string, data: any): any;
//# sourceMappingURL=lineFlexMessage.service.d.ts.map
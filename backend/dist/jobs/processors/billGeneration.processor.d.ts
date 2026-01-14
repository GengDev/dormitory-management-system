/**
 * Bill Generation Job Processor
 *
 * Process bill generation jobs สำหรับสร้างบิลรายเดือน
 *
 * @module server/src/jobs/processors/billGeneration.processor
 */
/**
 * Process Bill Generation Job
 *
 * @param data - Job data { tenantId, billingMonth, dueDate }
 * @returns Processing result
 *
 * @description
 * สร้างบิลให้ผู้เช่าคนหนึ่งในเดือนที่กำหนด
 * คำนวณค่าน้ำค่าไฟจาก utilities records
 */
export declare function processBillGenerationJob(data: {
    tenantId: string;
    billingMonth: string;
    dueDate: string;
}): Promise<{
    success: boolean;
    billId?: string;
}>;
//# sourceMappingURL=billGeneration.processor.d.ts.map
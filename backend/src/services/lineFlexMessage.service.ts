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
export function buildFlexMessage(template: string, data: any): any {
  switch (template) {
    case 'bill_notification':
      return buildBillNotification(data);
    case 'bill_detail':
      return buildBillDetail(data);
    case 'bill_overdue':
      return buildBillOverdue(data);
    case 'bill_summary':
      return buildBillSummary(data);
    case 'maintenance_confirmation':
      return buildMaintenanceConfirmation(data);
    case 'quick_reply_menu':
      return buildQuickReplyMenu(data);
    default:
      throw new Error(`Unknown Flex Message template: ${template}`);
  }
}

/**
 * Build Bill Notification Flex Message
 * 
 * @param data - Bill data
 * @returns Flex Message
 */
function buildBillNotification(data: any): any {
  const { billingMonth, roomNumber, rentAmount, waterAmount, electricityAmount, totalAmount, dueDate, billId } = data;

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📋 บิลค่าเช่า',
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
        },
        {
          type: 'text',
          text: `เดือน ${formatDate(billingMonth)}`,
          color: '#FFFFFFCC',
          size: 'sm',
          margin: 'md',
        },
      ],
      backgroundColor: '#1DB446',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ห้อง',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: roomNumber,
                  size: 'sm',
                  color: '#333333',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ค่าเช่า',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(rentAmount)}`,
                  size: 'sm',
                  color: '#333333',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ค่าน้ำ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(waterAmount)}`,
                  size: 'sm',
                  color: '#333333',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ค่าไฟ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(electricityAmount)}`,
                  size: 'sm',
                  color: '#333333',
                  align: 'end',
                },
              ],
            },
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'รวมทั้งสิ้น',
                  size: 'md',
                  color: '#333333',
                  weight: 'bold',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(totalAmount)}`,
                  size: 'md',
                  color: '#1DB446',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '📅 ครบกำหนดชำระ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: formatDate(dueDate),
                  size: 'sm',
                  color: '#FF6B6B',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ดูรายละเอียด',
            data: `action=view_bill&bill_id=${billId}`,
          },
          color: '#1DB446',
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ดูบิลทั้งหมด',
            data: 'action=list_bills',
          },
        },
      ],
      flex: 0,
    },
  };
}

/**
 * Build Bill Detail Flex Message
 */
function buildBillDetail(data: any): any {
  const { billNumber, items, totalAmount, paidAmount, remainingAmount, billId } = data;

  const itemBoxes = items.map((item: any) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: item.description,
        size: 'sm',
        color: '#666666',
        flex: 2,
      },
      {
        type: 'text',
        text: `${formatNumber(item.quantity)} หน่วย`,
        size: 'xs',
        color: '#AAAAAA',
        align: 'end',
        flex: 1,
      },
      {
        type: 'text',
        text: `฿${formatNumber(item.amount)}`,
        size: 'sm',
        color: '#333333',
        align: 'end',
        flex: 1,
      },
    ],
  }));

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📋 รายละเอียดบิล',
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
        },
        {
          type: 'text',
          text: billNumber,
          color: '#FFFFFFCC',
          size: 'sm',
          margin: 'md',
        },
      ],
      backgroundColor: '#1DB446',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: 'รายการ',
              size: 'xs',
              color: '#AAAAAA',
              weight: 'bold',
            },
            {
              type: 'separator',
              margin: 'xs',
            },
            ...itemBoxes,
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'รวมทั้งสิ้น',
                  size: 'md',
                  color: '#333333',
                  weight: 'bold',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(totalAmount)}`,
                  size: 'md',
                  color: '#1DB446',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ชำระแล้ว',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(paidAmount)}`,
                  size: 'sm',
                  color: '#666666',
                  align: 'end',
                },
              ],
              margin: 'sm',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'คงเหลือ',
                  size: 'md',
                  color: '#333333',
                  weight: 'bold',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(remainingAmount)}`,
                  size: 'md',
                  color: '#FF6B6B',
                  weight: 'bold',
                  align: 'end',
                },
              ],
              margin: 'sm',
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ชำระเงิน',
            data: `action=pay_bill&bill_id=${billId}`,
          },
          color: '#1DB446',
        },
      ],
      flex: 0,
    },
  };
}

/**
 * Build Bill Overdue Flex Message
 */
function buildBillOverdue(data: any): any {
  const { billNumber, remainingAmount, daysOverdue, billId } = data;

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '⚠️ บิลค้างชำระ',
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
        },
      ],
      backgroundColor: '#FF6B6B',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'บิลค่าเช่าของคุณค้างชำระแล้ว',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'บิลเลขที่',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: billNumber,
                  size: 'sm',
                  color: '#333333',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ยอดค้างชำระ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `฿${formatNumber(remainingAmount)}`,
                  size: 'md',
                  color: '#FF6B6B',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ค้างชำระ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `${daysOverdue} วัน`,
                  size: 'sm',
                  color: '#FF6B6B',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ชำระเงิน',
            data: `action=pay_bill&bill_id=${billId}`,
          },
          color: '#FF6B6B',
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ดูรายละเอียด',
            data: `action=view_bill&bill_id=${billId}`,
          },
        },
      ],
      flex: 0,
    },
  };
}

/**
 * Build Bill Summary Flex Message (for carousel)
 */
function buildBillSummary(data: any): any {
  const { billId, billingMonth, totalAmount, status } = data;
  const statusText = status === 'paid' ? 'ชำระแล้ว' : status === 'pending' ? 'รอชำระ' : 'ค้างชำระ';
  const statusColor = status === 'paid' ? '#1DB446' : status === 'pending' ? '#4A90E2' : '#FF6B6B';

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📋 บิลค่าเช่า',
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
        },
        {
          type: 'text',
          text: `เดือน ${formatDate(billingMonth)}`,
          color: '#FFFFFFCC',
          size: 'sm',
          margin: 'md',
        },
      ],
      backgroundColor: '#1DB446',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: 'ยอดรวม',
              size: 'sm',
              color: '#666666',
              flex: 1,
            },
            {
              type: 'text',
              text: `฿${formatNumber(totalAmount)}`,
              size: 'md',
              color: '#1DB446',
              weight: 'bold',
              align: 'end',
            },
          ],
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: 'สถานะ',
              size: 'sm',
              color: '#666666',
              flex: 1,
            },
            {
              type: 'text',
              text: statusText,
              size: 'sm',
              color: statusColor,
              weight: 'bold',
              align: 'end',
            },
          ],
          margin: 'sm',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ดูรายละเอียด',
            data: `action=view_bill&bill_id=${billId}`,
          },
          color: '#1DB446',
        },
      ],
      flex: 0,
    },
  };
}

/**
 * Build Maintenance Confirmation Flex Message
 */
function buildMaintenanceConfirmation(data: any): any {
  const { requestId, title, status } = data;
  const statusText = status === 'pending' ? 'รอดำเนินการ' : status === 'in_progress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น';

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🔧 แจ้งซ่อม',
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
        },
      ],
      backgroundColor: '#4A90E2',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'รับทราบการแจ้งซ่อมแล้ว',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'หัวข้อ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: title,
                  size: 'sm',
                  color: '#333333',
                  align: 'end',
                  weight: 'bold',
                  wrap: true,
                  flex: 2,
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'สถานะ',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: statusText,
                  size: 'sm',
                  color: '#4A90E2',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'เลขที่',
                  size: 'sm',
                  color: '#666666',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: `#${requestId}`,
                  size: 'xs',
                  color: '#AAAAAA',
                  align: 'end',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'ดูสถานะ',
            data: `action=view_maintenance&id=${requestId}`,
          },
        },
      ],
      flex: 0,
    },
  };
}

/**
 * Build Quick Reply Menu Flex Message
 */
function buildQuickReplyMenu(_data: any): any {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🏠 เมนูหลัก',
          weight: 'bold',
          size: 'xl',
          color: '#1DB446',
        },
        {
          type: 'separator',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📋 ดูบิล',
                data: 'action=list_bills',
              },
              color: '#1DB446',
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '⚠️ ค้างชำระ',
                data: 'action=list_overdue',
              },
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🔧 แจ้งซ่อม',
                data: 'action=report_maintenance',
              },
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '💬 ติดต่อแอดมิน',
                data: 'action=contact_admin',
              },
            },
          ],
        },
      ],
    },
  };
}

/**
 * Format Date
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Format Number
 * 
 * @param num - Number
 * @returns Formatted number string with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


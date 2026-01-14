/**
 * Admin Bills Page
 *
 * หน้าจัดการบิลสำหรับ admin
 *
 * @module app/admin/bills/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface Bill {
  id: string;
  tenantId: string;
  roomId: string;
  billingMonth: number;
  billingYear: number;
  rentAmount: number;
  waterUsage: number;
  waterRate: number;
  waterAmount: number;
  electricityUsage: number;
  electricityRate: number;
  electricityAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paymentDate: string;
  createdAt: string;
  tenant: {
    fullName: string;
    email: string;
  };
  room: {
    roomNumber: string;
    building: {
      name: string;
    };
  };
}

interface Tenant {
  id: string;
  fullName: string;
  email: string;
  room: {
    id: string;
    roomNumber: string;
    building: {
      name: string;
    };
  };
}

export default function AdminBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [formData, setFormData] = useState({
    tenantId: '',
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    rentAmount: 0,
    waterUsage: 0,
    waterRate: 15, // ค่าเริ่มต้นตามที่กำหนด
    electricityUsage: 0,
    electricityRate: 8, // ค่าเริ่มต้นตามที่กำหนด
    dueDate: '',
  });

  // Bulk bill generation
  const [bulkFormData, setBulkFormData] = useState({
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    rentAmount: 0,
    waterRate: 15,
    electricityRate: 8,
    dueDate: '',
  });

  useEffect(() => {
    fetchBills();
    fetchTenants();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await api.getBills();
      setBills(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.getTenants({ status: 'active' });
      setTenants(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get tenant's room ID
      const selectedTenantData = tenants.find(t => t.id === formData.tenantId);
      if (!selectedTenantData?.room?.id) {
        alert('ไม่พบข้อมูลห้องของผู้เช่า');
        return;
      }

      // Build items array for backend
      const items = [];

      // Add rent item
      if (formData.rentAmount > 0) {
        items.push({
          itemType: 'rent',
          description: 'ค่าเช่าห้อง',
          quantity: 1,
          unitPrice: formData.rentAmount,
          metadata: {}
        });
      }

      // Add water item
      if (formData.waterUsage > 0) {
        items.push({
          itemType: 'utility',
          description: `ค่าน้ำ (${formData.waterUsage} หน่วย × ${formData.waterRate} บาท)`,
          quantity: formData.waterUsage,
          unitPrice: formData.waterRate,
          metadata: { usage: formData.waterUsage, type: 'water' }
        });
      }

      // Add electricity item
      if (formData.electricityUsage > 0) {
        items.push({
          itemType: 'utility',
          description: `ค่าไฟฟ้า (${formData.electricityUsage} หน่วย × ${formData.electricityRate} บาท)`,
          quantity: formData.electricityUsage,
          unitPrice: formData.electricityRate,
          metadata: { usage: formData.electricityUsage, type: 'electricity' }
        });
      }

      if (items.length === 0) {
        alert('กรุณาระบุรายการอย่างน้อย 1 รายการ');
        return;
      }

      // Prepare billing month as date
      const billingMonthDate = new Date(formData.billingYear, formData.billingMonth - 1, 1);

      const billData = {
        tenantId: formData.tenantId,
        roomId: selectedTenantData.room.id,
        billingMonth: billingMonthDate.toISOString(),
        dueDate: formData.dueDate || new Date(formData.billingYear, formData.billingMonth, 5).toISOString().split('T')[0],
        items,
        notes: ''
      };

      if (editingBill) {
        // Update bill - Note: Backend might not support update with items yet
        // For now, we'll show an error
        alert('การแก้ไขบิลยังไม่รองรับในขณะนี้ กรุณาลบและสร้างใหม่');
        return;
      } else {
        // Create bill
        await api.createBill(billData);
      }

      setShowAddModal(false);
      setEditingBill(null);
      setFormData({
        tenantId: '',
        billingMonth: new Date().getMonth() + 1,
        billingYear: new Date().getFullYear(),
        rentAmount: 0,
        waterUsage: 0,
        waterRate: 15,
        electricityUsage: 0,
        electricityRate: 8,
        dueDate: '',
      });
      fetchBills();
    } catch (error: any) {
      console.error('Failed to save bill:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      alert(errorMessage);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.generateBulkBills(bulkFormData);
      setShowBulkModal(false);
      setBulkFormData({
        billingMonth: new Date().getMonth() + 1,
        billingYear: new Date().getFullYear(),
        rentAmount: 0,
        waterRate: 15,
        electricityRate: 8,
        dueDate: '',
      });
      fetchBills();
    } catch (error: any) {
      console.error('Failed to generate bulk bills:', error);
      alert('เกิดข้อผิดพลาดในการสร้างบิล');
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      tenantId: bill.tenantId,
      billingMonth: bill.billingMonth,
      billingYear: bill.billingYear,
      rentAmount: bill.rentAmount,
      waterUsage: bill.waterUsage,
      waterRate: bill.waterRate,
      electricityUsage: bill.electricityUsage,
      electricityRate: bill.electricityRate,
      dueDate: bill.dueDate,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (bill: Bill) => {
    if (!confirm(`ต้องการลบบิลของ ${bill.tenant?.fullName || 'ผู้เช่า'} ใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.deleteBill(bill.id);
      fetchBills();
    } catch (error: any) {
      console.error('Failed to delete bill:', error);
      alert('ไม่สามารถลบบิลได้');
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    try {
      await api.put(`/api/bills/${bill.id}/status`, {
        status: 'paid'
      });
      fetchBills();
    } catch (error: any) {
      console.error('Failed to mark bill as paid:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleSendNotification = async (bill: Bill) => {
    if (!confirm(`ต้องการส่งแจ้งเตือนบิลนี้ไปยัง ${bill.tenant?.fullName} ทาง LINE ใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.sendBillNotification(bill.id, bill.tenantId);
      alert('ส่งแจ้งเตือนเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      alert('เกิดข้อผิดพลาดในการส่งแจ้งเตือน');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอชำระ';
      case 'paid':
        return 'ชำระแล้ว';
      case 'overdue':
        return 'เกินกำหนด';
      default:
        return status;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[month - 1];
  };

  const selectedTenantInfo = tenants.find(t => t.id === selectedTenant);

  return (
    <AdminLayout title="จัดการบิล">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">บิลทั้งหมด</h2>
            <p className="mt-1 text-sm text-gray-600">
              จัดการบิล ค่าเช่า ค่าน้ำ ค่าไฟ
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowBulkModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              📊 สร้างบิลทั้งหมด
            </button>
            <button
              onClick={() => {
                setEditingBill(null);
                setFormData({
                  tenantId: '',
                  billingMonth: new Date().getMonth() + 1,
                  billingYear: new Date().getFullYear(),
                  rentAmount: 0,
                  waterUsage: 0,
                  waterRate: 15,
                  electricityUsage: 0,
                  electricityRate: 8,
                  dueDate: '',
                });
                setShowAddModal(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              ➕ เพิ่มบิล
            </button>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ยังไม่มีข้อมูลบิล</div>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {bills.map((bill) => (
                <li key={bill.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bill.status === 'paid' ? 'bg-green-100' :
                            bill.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                            <span className={`font-medium ${bill.status === 'paid' ? 'text-green-600' :
                              bill.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                              ฿{bill.totalAmount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {bill.tenant?.fullName || 'ไม่ระบุ'}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}
                            >
                              {getStatusText(bill.status)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>🏠 ห้อง {bill.room?.roomNumber || 'N/A'} - {bill.room?.building?.name || 'N/A'}</p>
                            <p>
                              📅 {bill.billingMonth ? getMonthName(bill.billingMonth) : 'N/A'} {bill.billingYear || ''}
                              {bill.dueDate && ` | ครบกำหนด: ${new Date(bill.dueDate).toLocaleDateString('th-TH')}`}
                            </p>
                            <p>
                              💰 ค่าเช่า: ฿{bill.rentAmount?.toLocaleString() || '0'} |
                              💧 น้ำ: {bill.waterUsage || 0} หน่วย (฿{bill.waterAmount?.toLocaleString() || '0'}) |
                              ⚡ ไฟ: {bill.electricityUsage || 0} หน่วย (฿{bill.electricityAmount?.toLocaleString() || '0'})
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(bill)}
                            className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            ชำระแล้ว
                          </button>
                        )}
                        <button
                          onClick={() => handleSendNotification(bill)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          🔔 แจ้งเตือน
                        </button>
                        <button
                          onClick={() => handleEdit(bill)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(bill)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingBill ? 'แก้ไขบิล' : 'เพิ่มบิลใหม่'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700">
                      ผู้เช่า *
                    </label>
                    <select
                      id="tenantId"
                      required
                      value={formData.tenantId}
                      onChange={(e) => {
                        setFormData({ ...formData, tenantId: e.target.value });
                        setSelectedTenant(e.target.value);
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">เลือกผู้เช่า</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.fullName} - ห้อง {tenant.room?.roomNumber || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {selectedTenantInfo && (
                      <p className="mt-1 text-sm text-gray-600">
                        🏠 ห้อง {selectedTenantInfo.room?.roomNumber || 'N/A'} - {selectedTenantInfo.room?.building?.name || 'N/A'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billingMonth" className="block text-sm font-medium text-gray-700">
                        เดือน *
                      </label>
                      <select
                        id="billingMonth"
                        required
                        value={formData.billingMonth}
                        onChange={(e) => setFormData({ ...formData, billingMonth: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            {getMonthName(month)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="billingYear" className="block text-sm font-medium text-gray-700">
                        ปี *
                      </label>
                      <input
                        type="number"
                        id="billingYear"
                        min="2020"
                        max="2030"
                        required
                        value={formData.billingYear}
                        onChange={(e) => setFormData({ ...formData, billingYear: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">
                      ค่าเช่า (฿) *
                    </label>
                    <input
                      type="number"
                      id="rentAmount"
                      min="0"
                      required
                      value={formData.rentAmount}
                      onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="waterUsage" className="block text-sm font-medium text-gray-700">
                        น้ำ (หน่วย)
                      </label>
                      <input
                        type="number"
                        id="waterUsage"
                        min="0"
                        step="0.01"
                        value={formData.waterUsage}
                        onChange={(e) => setFormData({ ...formData, waterUsage: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="waterRate" className="block text-sm font-medium text-gray-700">
                        อัตราค่าน้ำ (฿/หน่วย)
                      </label>
                      <input
                        type="number"
                        id="waterRate"
                        min="0"
                        step="0.01"
                        value={formData.waterRate}
                        onChange={(e) => setFormData({ ...formData, waterRate: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="electricityUsage" className="block text-sm font-medium text-gray-700">
                        ไฟฟ้า (หน่วย)
                      </label>
                      <input
                        type="number"
                        id="electricityUsage"
                        min="0"
                        step="0.01"
                        value={formData.electricityUsage}
                        onChange={(e) => setFormData({ ...formData, electricityUsage: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="electricityRate" className="block text-sm font-medium text-gray-700">
                        อัตราค่าไฟ (฿/หน่วย)
                      </label>
                      <input
                        type="number"
                        id="electricityRate"
                        min="0"
                        step="0.01"
                        value={formData.electricityRate}
                        onChange={(e) => setFormData({ ...formData, electricityRate: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      วันครบกำหนด
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">สรุปยอด</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>ค่าเช่า: ฿{formData.rentAmount?.toLocaleString() || '0'}</p>
                      <p>ค่าน้ำ: {formData.waterUsage || 0} × ฿{formData.waterRate || 0} = ฿{((formData.waterUsage || 0) * (formData.waterRate || 0)).toLocaleString()}</p>
                      <p>ค่าไฟ: {formData.electricityUsage || 0} × ฿{formData.electricityRate || 0} = ฿{((formData.electricityUsage || 0) * (formData.electricityRate || 0)).toLocaleString()}</p>
                      <p className="font-medium text-gray-900 border-t pt-1">
                        รวมทั้งสิ้น: ฿{((formData.rentAmount || 0) + ((formData.waterUsage || 0) * (formData.waterRate || 0)) + ((formData.electricityUsage || 0) * (formData.electricityRate || 0))).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingBill(null);
                        setFormData({
                          tenantId: '',
                          billingMonth: new Date().getMonth() + 1,
                          billingYear: new Date().getFullYear(),
                          rentAmount: 0,
                          waterUsage: 0,
                          waterRate: 15,
                          electricityUsage: 0,
                          electricityRate: 8,
                          dueDate: '',
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {editingBill ? 'บันทึก' : 'เพิ่ม'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  สร้างบิลทั้งหมด
                </h3>
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bulkBillingMonth" className="block text-sm font-medium text-gray-700">
                        เดือน *
                      </label>
                      <select
                        id="bulkBillingMonth"
                        required
                        value={bulkFormData.billingMonth}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, billingMonth: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            {getMonthName(month)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="bulkBillingYear" className="block text-sm font-medium text-gray-700">
                        ปี *
                      </label>
                      <input
                        type="number"
                        id="bulkBillingYear"
                        min="2020"
                        max="2030"
                        required
                        value={bulkFormData.billingYear}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, billingYear: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bulkRentAmount" className="block text-sm font-medium text-gray-700">
                      ค่าเช่าทั้งหมด (฿) *
                    </label>
                    <input
                      type="number"
                      id="bulkRentAmount"
                      min="0"
                      required
                      value={bulkFormData.rentAmount}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, rentAmount: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      ค่าเช่าจะถูกกำหนดตามห้องพักของแต่ละผู้เช่า หากไม่ได้กำหนดที่นี่
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bulkWaterRate" className="block text-sm font-medium text-gray-700">
                        อัตราค่าน้ำ (฿/หน่วย) *
                      </label>
                      <input
                        type="number"
                        id="bulkWaterRate"
                        min="0"
                        step="0.01"
                        required
                        value={bulkFormData.waterRate}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, waterRate: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="bulkElectricityRate" className="block text-sm font-medium text-gray-700">
                        อัตราค่าไฟ (฿/หน่วย) *
                      </label>
                      <input
                        type="number"
                        id="bulkElectricityRate"
                        min="0"
                        step="0.01"
                        required
                        value={bulkFormData.electricityRate}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, electricityRate: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bulkDueDate" className="block text-sm font-medium text-gray-700">
                      วันครบกำหนด *
                    </label>
                    <input
                      type="date"
                      id="bulkDueDate"
                      required
                      value={bulkFormData.dueDate}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, dueDate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                      ⚠️ จะสร้างบิลสำหรับผู้เช่าที่ยังไม่มียอดค้างชำระในเดือนนี้
                      ผู้เช่าจะต้องกรอกข้อมูลการใช้น้ำและไฟฟ้าด้วยตนเองผ่าน LINE
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkModal(false);
                        setBulkFormData({
                          billingMonth: new Date().getMonth() + 1,
                          billingYear: new Date().getFullYear(),
                          rentAmount: 0,
                          waterRate: 15,
                          electricityRate: 8,
                          dueDate: '',
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      สร้างบิลทั้งหมด
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


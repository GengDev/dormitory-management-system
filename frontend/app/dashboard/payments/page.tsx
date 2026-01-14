/**
 * Tenant Payments Page
 *
 * หน้าดูประวัติการชำระเงินสำหรับผู้เช่า
 *
 * @module app/dashboard/payments/page
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/auth';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  status: string;
  createdAt: string;
  bill: {
    billingMonth: number;
    billingYear: number;
    totalAmount: number;
    room: {
      roomNumber: string;
      building: {
        name: string;
      };
    };
  };
}

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.getPayments(params);
      setPayments(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอตรวจสอบ';
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'rejected':
        return 'ปฏิเสธ';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'โอนเงิน';
      case 'cash':
        return 'เงินสด';
      case 'promptpay':
        return 'พร้อมเพย์';
      case 'credit_card':
        return 'บัตรเครดิต';
      default:
        return method;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[month - 1];
  };

  const totalApproved = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ประวัติการชำระเงิน</h1>
              <p className="mt-1 text-sm text-gray-600">
                ดูสถานะและประวัติการชำระเงินของคุณ
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-green-800 truncate">
                    ชำระแล้วทั้งหมด
                  </dt>
                  <dd className="text-lg font-medium text-green-900">
                    ฿{totalApproved?.toLocaleString() || '0'}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-yellow-800 truncate">
                    รอตรวจสอบ
                  </dt>
                  <dd className="text-lg font-medium text-yellow-900">
                    {pendingCount} รายการ
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-blue-800 truncate">
                    การชำระทั้งหมด
                  </dt>
                  <dd className="text-lg font-medium text-blue-900">
                    {payments.length} รายการ
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">
              สถานะ:
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ไม่พบข้อมูลการชำระเงิน</div>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <li key={payment.id}>
                  <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${payment.status === 'approved' ? 'bg-green-100' :
                              payment.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                            <span className={`font-bold ${payment.status === 'approved' ? 'text-green-600' :
                                payment.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                              ฿{payment.amount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-6">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {getMonthName(payment.bill.billingMonth)} {payment.bill.billingYear}
                            </h3>
                            <span
                              className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}
                            >
                              {getStatusText(payment.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>🏠 ห้อง {payment.bill.room.roomNumber} - {payment.bill.room.building.name}</p>
                            <p>💳 วิธีการ: {getPaymentMethodText(payment.paymentMethod)}</p>
                            {payment.referenceNumber && (
                              <p>🔢 เลขที่อ้างอิง: {payment.referenceNumber}</p>
                            )}
                            <p className="text-gray-500">
                              📅 ชำระเมื่อ: {new Date(payment.paymentDate).toLocaleDateString('th-TH')} {new Date(payment.paymentDate).toLocaleTimeString('th-TH')}
                            </p>
                            {payment.notes && (
                              <p className="mt-1">📝 หมายเหตุ: {payment.notes}</p>
                            )}
                          </div>
                          {payment.status === 'pending' && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-sm text-yellow-800">
                                ⏳ กำลังรอการตรวจสอบจากระบบ กรุณารอการแจ้งเตือนทาง LINE
                              </p>
                            </div>
                          )}
                          {payment.status === 'approved' && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm text-green-800">
                                ✅ การชำระเงินได้รับการอนุมัติแล้ว
                              </p>
                            </div>
                          )}
                          {payment.status === 'rejected' && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm text-red-800">
                                ❌ การชำระเงินถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}


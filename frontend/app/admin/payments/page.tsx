/**
 * Admin Payments Page
 *
 * หน้าจัดการการชำระเงินสำหรับ admin
 *
 * @module app/admin/payments/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface Payment {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
  bill: {
    tenant: {
      fullName: string;
    };
    room: {
      roomNumber: string;
      building: {
        name: string;
      };
    };
    billingMonth: number;
    billingYear: number;
    totalAmount: number;
  };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  useEffect(() => {
    fetchPayments();
  }, [filterStatus, filterMonth, filterYear]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterMonth) params.append('month', filterMonth);
      if (filterYear) params.append('year', filterYear);

      const response = await api.getPayments(Object.fromEntries(params));
      setPayments(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: Payment) => {
    try {
      await api.approvePayment(payment.id);
      fetchPayments();
    } catch (error: any) {
      console.error('Failed to approve payment:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleReject = async (payment: Payment) => {
    if (!confirm('ต้องการปฏิเสธการชำระเงินนี้ใช่หรือไม่?')) {
      return;
    }

    try {
      await api.rejectPayment(payment.id);
      fetchPayments();
    } catch (error: any) {
      console.error('Failed to reject payment:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
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

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const approvedAmount = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <AdminLayout title="จัดการการชำระเงิน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">การชำระเงินทั้งหมด</h2>
            <p className="mt-1 text-sm text-gray-600">
              จัดการและตรวจสอบการชำระเงินจากผู้เช่า
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ยอดรวมทั้งหมด
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ฿{totalAmount?.toLocaleString() || '0'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ยอดอนุมัติแล้ว
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ฿{approvedAmount?.toLocaleString() || '0'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      รอตรวจสอบ
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {payments.filter(p => p.status === 'pending').length} รายการ
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">
                สถานะ
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>

            <div>
              <label htmlFor="filterMonth" className="block text-sm font-medium text-gray-700">
                เดือน
              </label>
              <select
                id="filterMonth"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">ทั้งหมด</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filterYear" className="block text-sm font-medium text-gray-700">
                ปี
              </label>
              <select
                id="filterYear"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">ทั้งหมด</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterMonth('');
                  setFilterYear('');
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                ล้างตัวกรอง
              </button>
            </div>
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
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${payment.status === 'approved' ? 'bg-green-100' :
                            payment.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                            <span className={`font-medium ${payment.status === 'approved' ? 'text-green-600' :
                              payment.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                              ฿{payment.amount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {payment.bill?.tenant?.fullName || 'ไม่ระบุ'}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                            >
                              {getStatusText(payment.status)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>🏠 ห้อง {payment.bill?.room?.roomNumber || 'N/A'} - {payment.bill?.room?.building?.name || 'N/A'}</p>
                            <p>
                              📅 {payment.bill?.billingMonth ? getMonthName(payment.bill.billingMonth) : 'N/A'} {payment.bill?.billingYear || ''}
                              | {getPaymentMethodText(payment.paymentMethod)}
                            </p>
                            {payment.referenceNumber && (
                              <p>🔢 เลขที่อ้างอิง: {payment.referenceNumber}</p>
                            )}
                            {payment.notes && (
                              <p>📝 หมายเหตุ: {payment.notes}</p>
                            )}
                            <p className="text-gray-500">
                              ชำระเมื่อ: {new Date(payment.paymentDate).toLocaleDateString('th-TH')} {new Date(payment.paymentDate).toLocaleTimeString('th-TH')}
                            </p>
                            {payment.receiptUrl && (
                              <div className="mt-2">
                                <a
                                  href={payment.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                  📄 ดูสลิปหลักฐาน
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(payment)}
                              className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleReject(payment)}
                              className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              ปฏิเสธ
                            </button>
                          </>
                        )}
                        {payment.status === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700">
                            ✅ อนุมัติแล้ว
                          </span>
                        )}
                        {payment.status === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700">
                            ❌ ปฏิเสธแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


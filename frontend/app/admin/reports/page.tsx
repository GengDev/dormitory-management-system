/**
 * Admin Reports Page
 *
 * หน้าดูรายงานสำหรับ admin
 *
 * @module app/admin/reports/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  totalTenants: number;
  activeTenants: number;
  maintenanceRequests: number;
  pendingPayments: number;
  monthlyRevenue: Array<{
    month: string;
    year: number;
    revenue: number;
  }>;
  buildingStats: Array<{
    buildingId: string;
    buildingName: string;
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    revenue: number;
  }>;
  tenantPaymentStats: Array<{
    tenantId: string;
    tenantName: string;
    totalPaid: number;
    totalOwed: number;
    paymentRate: number;
  }>;
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod, startDate, endDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedPeriod !== 'custom') {
        params.append('period', selectedPeriod);
      } else if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const response = await api.getReports(Object.fromEntries(params));
      setReportData(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      const params = new URLSearchParams();

      if (selectedPeriod !== 'custom') {
        params.append('period', selectedPeriod);
      } else if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      params.append('format', type);

      const response = await api.exportReports(Object.fromEntries(params), {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Failed to export report:', error);
      alert('ฟีเจอร์การส่งออกยังไม่พร้อมใช้งานในขณะนี้\nกรุณาใช้ Export ในแต่ละหมวดหมู่ (Occupancy, Revenue, Overdue) แทน');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="รายงาน">
        <div className="text-center py-12">
          <div className="text-gray-500">กำลังโหลดรายงาน...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!reportData) {
    return (
      <AdminLayout title="รายงาน">
        <div className="text-center py-12">
          <div className="text-red-500">ไม่สามารถโหลดข้อมูลรายงานได้</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="รายงาน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">รายงานสรุป</h2>
            <p className="mt-1 text-sm text-gray-600">
              วิเคราะห์ข้อมูลและสถิติของหอพัก
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExportReport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              📄 ส่งออก PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              📊 ส่งออก Excel
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-700">
                ช่วงเวลา
              </label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="current_month">เดือนนี้</option>
                <option value="last_month">เดือนที่แล้ว</option>
                <option value="last_3_months">3 เดือนล่าสุด</option>
                <option value="last_6_months">6 เดือนล่าสุด</option>
                <option value="current_year">ปีนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={fetchReports}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                🔄 รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      รายได้รวม
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ฿{reportData.totalRevenue?.toLocaleString() || '0'}
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
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">💸</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ค่าใช้จ่าย
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ฿{reportData.totalExpenses?.toLocaleString() || '0'}
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
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📈</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      กำไรสุทธิ
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ฿{reportData.netIncome?.toLocaleString() || '0'}
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
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🏠</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      อัตราการเข้าพัก
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData.occupancyRate?.toFixed(1) || '0.0'}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ผู้เช่าทั้งหมด
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData.totalTenants}
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
                      ผู้เช่าที่ใช้งาน
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData.activeTenants}
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
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🔧</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      การแจ้งซ่อม
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData.maintenanceRequests}
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
                    <span className="text-white text-sm font-medium">💳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      รอตรวจสอบ
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData.pendingPayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              รายได้รายเดือน
            </h3>
            <div className="space-y-2">
              {(reportData.monthlyRevenue || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">
                    {item.month} {item.year}
                  </div>
                  <div className="text-sm text-gray-500">
                    ฿{item.revenue?.toLocaleString() || '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Building Stats */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              สถิติตามอาคาร
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      อาคาร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ห้องทั้งหมด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ห้องเข้าพัก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      อัตราการเข้าพัก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายได้
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(reportData.buildingStats || []).map((building, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {building.buildingName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {building.totalRooms}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {building.occupiedRooms}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {building.occupancyRate?.toFixed(1) || '0.0'}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ฿{building.revenue?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Paying Tenants */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              ผู้เช่าที่ชำระเงินดีเยี่ยม
            </h3>
            <div className="space-y-2">
              {(reportData.tenantPaymentStats || []).slice(0, 10).map((tenant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {tenant.tenantName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ชำระแล้ว: ฿{tenant.totalPaid?.toLocaleString() || '0'} | ค้างชำระ: ฿{tenant.totalOwed?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ฿{(tenant.paymentRate || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">ค่าเฉลี่ยการชำระ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


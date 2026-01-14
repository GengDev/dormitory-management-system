/**
 * Admin Maintenance Page
 *
 * หน้าจัดการการแจ้งซ่อมสำหรับ admin
 *
 * @module app/admin/maintenance/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface MaintenanceRequest {
  id: string;
  tenantId: string;
  roomId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  images: string[];
  estimatedCost: number;
  actualCost: number;
  scheduledDate: string;
  completedDate: string;
  notes: string;
  createdAt: string;
  tenant: {
    fullName: string;
    email: string;
    phone: string;
  };
  room: {
    roomNumber: string;
    building: {
      name: string;
    };
  };
}

export default function AdminMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    estimatedCost: 0,
    actualCost: 0,
    scheduledDate: '',
    completedDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.getMaintenanceRequests(params);
      setRequests(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      estimatedCost: request.estimatedCost || 0,
      actualCost: request.actualCost || 0,
      scheduledDate: request.scheduledDate || '',
      completedDate: request.completedDate || '',
      notes: request.notes || '',
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequest) return;

    try {
      await api.updateMaintenanceRequest(selectedRequest.id, updateData);
      setShowUpdateModal(false);
      setSelectedRequest(null);
      setUpdateData({
        status: '',
        estimatedCost: 0,
        actualCost: 0,
        scheduledDate: '',
        completedDate: '',
        notes: '',
      });
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to update maintenance request:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอดำเนินการ';
      case 'in_progress':
        return 'กำลังดำเนินการ';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'ต่ำ';
      case 'medium':
        return 'ปานกลาง';
      case 'high':
        return 'สูง';
      case 'urgent':
        return 'ด่วนที่สุด';
      default:
        return priority;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'electrical':
        return 'ไฟฟ้า';
      case 'plumbing':
        return 'ประปา';
      case 'structural':
        return 'โครงสร้าง';
      case 'appliance':
        return 'เครื่องใช้ไฟฟ้า';
      case 'cleaning':
        return 'ทำความสะอาด';
      case 'other':
        return 'อื่นๆ';
      default:
        return category;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <AdminLayout title="จัดการการแจ้งซ่อม">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">การแจ้งซ่อมทั้งหมด</h2>
            <p className="mt-1 text-sm text-gray-600">
              จัดการและติดตามการแจ้งซ่อมจากผู้เช่า
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      รอดำเนินการ
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingCount}
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
                    <span className="text-white text-sm font-medium">🔧</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      กำลังดำเนินการ
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {inProgressCount}
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
                      เสร็จสิ้น
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {completedCount}
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
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      รวมทั้งหมด
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {requests.length}
                    </dd>
                  </dl>
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
              <option value="pending">รอดำเนินการ</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* Maintenance Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ไม่พบข้อมูลการแจ้งซ่อม</div>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {requests.map((request) => (
                <li key={request.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            request.status === 'completed' ? 'bg-green-100' :
                            request.status === 'in_progress' ? 'bg-blue-100' :
                            request.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            <span className={`font-medium text-sm ${
                              request.status === 'completed' ? 'text-green-600' :
                              request.status === 'in_progress' ? 'text-blue-600' :
                              request.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {request.priority === 'urgent' ? '🚨' :
                               request.priority === 'high' ? '⚠️' :
                               request.priority === 'medium' ? '🟡' : 'ℹ️'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {request.title}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                            >
                              {getStatusText(request.status)}
                            </span>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}
                            >
                              {getPriorityText(request.priority)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>👤 {request.tenant.fullName} | 📞 {request.tenant.phone}</p>
                            <p>🏠 ห้อง {request.room.roomNumber} - {request.room.building.name}</p>
                            <p>🔧 {getCategoryText(request.category)}</p>
                            <p className="text-gray-500">
                              แจ้งเมื่อ: {new Date(request.createdAt).toLocaleDateString('th-TH')}
                            </p>
                            {request.description && (
                              <p className="mt-1">📝 {request.description}</p>
                            )}
                            {request.estimatedCost > 0 && (
                              <p className="text-blue-600">
                                💰 ประมาณการ: ฿{request.estimatedCost?.toLocaleString() || '0'}
                              </p>
                            )}
                            {request.actualCost > 0 && (
                              <p className="text-green-600">
                                💰 ต้นทุนจริง: ฿{request.actualCost?.toLocaleString() || '0'}
                              </p>
                            )}
                            {request.scheduledDate && (
                              <p className="text-orange-600">
                                📅 นัดหมาย: {new Date(request.scheduledDate).toLocaleDateString('th-TH')}
                              </p>
                            )}
                            {request.completedDate && (
                              <p className="text-green-600">
                                ✅ เสร็จสิ้น: {new Date(request.completedDate).toLocaleDateString('th-TH')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUpdate(request)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          อัปเดต
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Update Modal */}
        {showUpdateModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  อัปเดตการแจ้งซ่อม
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{selectedRequest.title}</strong><br />
                  {selectedRequest.tenant.fullName} - ห้อง {selectedRequest.room.roomNumber}
                </p>
                <form onSubmit={handleSubmitUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      สถานะ *
                    </label>
                    <select
                      id="status"
                      required
                      value={updateData.status}
                      onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="pending">รอดำเนินการ</option>
                      <option value="in_progress">กำลังดำเนินการ</option>
                      <option value="completed">เสร็จสิ้น</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700">
                        ประมาณการค่าใช้จ่าย
                      </label>
                      <input
                        type="number"
                        id="estimatedCost"
                        min="0"
                        value={updateData.estimatedCost}
                        onChange={(e) => setUpdateData({ ...updateData, estimatedCost: parseFloat(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="actualCost" className="block text-sm font-medium text-gray-700">
                        ต้นทุนจริง
                      </label>
                      <input
                        type="number"
                        id="actualCost"
                        min="0"
                        value={updateData.actualCost}
                        onChange={(e) => setUpdateData({ ...updateData, actualCost: parseFloat(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                        วันนัดหมาย
                      </label>
                      <input
                        type="date"
                        id="scheduledDate"
                        value={updateData.scheduledDate}
                        onChange={(e) => setUpdateData({ ...updateData, scheduledDate: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="completedDate" className="block text-sm font-medium text-gray-700">
                        วันที่เสร็จสิ้น
                      </label>
                      <input
                        type="date"
                        id="completedDate"
                        value={updateData.completedDate}
                        onChange={(e) => setUpdateData({ ...updateData, completedDate: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      หมายเหตุ
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={updateData.notes}
                      onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateModal(false);
                        setSelectedRequest(null);
                        setUpdateData({
                          status: '',
                          estimatedCost: 0,
                          actualCost: 0,
                          scheduledDate: '',
                          completedDate: '',
                          notes: '',
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
                      บันทึก
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


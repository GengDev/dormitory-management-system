/**
 * Admin Tenants Page
 *
 * หน้าจัดการผู้เช่าสำหรับ admin
 *
 * @module app/admin/tenants/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface Tenant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  lineUserId: string;
  idCardNumber: string;
  dateOfBirth: string;
  occupation: string;
  emergencyContact: string;
  emergencyPhone: string;
  moveInDate: string;
  moveOutDate: string;
  status: string;
  room: {
    id: string;
    roomNumber: string;
    building: {
      name: string;
    };
  } | null;
  lineUser?: {
    id: string;
    lineUserId: string;
    displayName: string;
  } | null;
}

interface Room {
  id: string;
  roomNumber: string;
  building: {
    id: string;
    name: string;
  };
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    lineUserId: '',
    idCardNumber: '',
    dateOfBirth: '',
    occupation: '',
    emergencyContact: '',
    emergencyPhone: '',
    moveInDate: '',
    roomId: '',
  });
  const [resetPasswordModal, setResetPasswordModal] = useState<{ show: boolean; tenant: Tenant | null; newPassword: string | null }>({ show: false, tenant: null, newPassword: null });

  useEffect(() => {
    fetchTenants();
    fetchRooms();
    fetchUnlinkedUsers();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.getTenants();
      setTenants(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.getRooms({ status: 'available' });
      setRooms(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchUnlinkedUsers = async () => {
    try {
      const response = await api.get('/api/line/unlinked-users');
      setUnlinkedUsers(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch unlinked users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.roomId) {
        alert('กรุณาเลือกห้องพัก');
        return;
      }

      if (!formData.moveInDate) {
        alert('กรุณาระบุวันที่เข้าอยู่');
        return;
      }
      const payload: any = {
        ...formData,
        contractStartDate: formData.moveInDate,
      };

      // Clean up empty fields - Only if NOT editing (for new creation)
      // When editing, we want to allow sending null/empty to DISCONNECT relations
      if (!editingTenant) {
        if (!payload.lineUserId) delete payload.lineUserId;
        if (!payload.email) delete payload.email;
      } else {
        // In edit mode, convert empty string to null to signal disconnection
        if (payload.lineUserId === '') payload.lineUserId = null;
        if (payload.email === '') payload.email = null;
      }

      if (editingTenant) {
        // Update tenant
        await api.updateTenant(editingTenant.id, payload);
      } else {
        // Create tenant
        await api.createTenant(payload);
      }

      setShowAddModal(false);
      setEditingTenant(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        lineUserId: '',
        idCardNumber: '',
        dateOfBirth: '',
        occupation: '',
        emergencyContact: '',
        emergencyPhone: '',
        moveInDate: '',
        roomId: '',
      });
      fetchTenants();
      fetchUnlinkedUsers(); // Refresh unlinked users
    } catch (error: any) {
      console.error('Failed to save tenant:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      fullName: tenant.fullName,
      email: tenant.email,
      phone: tenant.phone,
      lineUserId: tenant.lineUserId || '',
      idCardNumber: tenant.idCardNumber,
      dateOfBirth: tenant.dateOfBirth ? new Date(tenant.dateOfBirth).toISOString().split('T')[0] : '',
      occupation: tenant.occupation || '',
      emergencyContact: tenant.emergencyContact || '',
      emergencyPhone: tenant.emergencyPhone || '',
      moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split('T')[0] : '',
      roomId: tenant.room?.id || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`ต้องการลบผู้เช่า "${tenant.fullName}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.deleteTenant(tenant.id);
      fetchTenants();
    } catch (error: any) {
      console.error('Failed to delete tenant:', error);
      alert('ไม่สามารถลบผู้เช่าได้ อาจมีข้อมูลเกี่ยวข้อง');
    }
  };

  const handleMoveOut = async (tenant: Tenant) => {
    if (!confirm(`ต้องการให้ผู้เช่า "${tenant.fullName}" ย้ายออกใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.moveOutTenant(tenant.id, {
        moveOutDate: new Date().toISOString().split('T')[0]
      });
      fetchTenants();
    } catch (error: any) {
      console.error('Failed to move out tenant:', error);
      alert('เกิดข้อผิดพลาดในการย้ายออก');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'moved_out':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResetPassword = async (tenant: Tenant) => {
    if (!confirm(`ต้องการรีเซ็ตรหัสผ่านให้ "${tenant.fullName}" ใช่หรือไม่?\n\nรหัสผ่านใหม่จะเป็นเบอร์โทรศัพท์: ${tenant.phone}`)) {
      return;
    }

    try {
      const response = await api.resetTenantPassword(tenant.id);
      const { newPassword, notificationSent } = response.data.data;

      setResetPasswordModal({
        show: true,
        tenant,
        newPassword
      });

      if (notificationSent) {
        alert('✅ รีเซ็ตรหัสผ่านสำเร็จ และส่ง LINE notification ให้ผู้เช่าแล้ว');
      } else {
        alert('✅ รีเซ็ตรหัสผ่านสำเร็จ\n⚠️ กรุณาแจ้งรหัสผ่านใหม่ให้ผู้เช่าด้วยตนเอง (ไม่มี LINE)');
      }
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      alert('❌ เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('📋 คัดลอกรหัสผ่านแล้ว');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'เช่าอยู่';
      case 'inactive':
        return 'ไม่ใช้งาน';
      case 'moved_out':
        return 'ย้ายออกแล้ว';
      default:
        return status;
    }
  };

  return (
    <AdminLayout title="จัดการผู้เช่า">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ผู้เช่าทั้งหมด</h2>
            <p className="mt-1 text-sm text-gray-600">
              จัดการข้อมูลผู้เช่าและสถานะ
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTenant(null);
              setFormData({
                fullName: '',
                email: '',
                phone: '',
                lineUserId: '',
                idCardNumber: '',
                dateOfBirth: '',
                occupation: '',
                emergencyContact: '',
                emergencyPhone: '',
                moveInDate: '',
                roomId: '',
              });
              setShowAddModal(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            ➕ เพิ่มผู้เช่า
          </button>
        </div>

        {/* Tenants List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ยังไม่มีข้อมูลผู้เช่า</div>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <li key={tenant.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {tenant.fullName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {tenant.fullName}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}
                            >
                              {getStatusText(tenant.status)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>📧 {tenant.email} | 📞 {tenant.phone}</p>
                            {tenant.room && (
                              <p className="text-blue-600">
                                🏠 ห้อง {tenant.room.roomNumber} - {tenant.room.building.name}
                              </p>
                            )}
                            {tenant.lineUserId && (
                              <p className="text-green-600">
                                📱 LINE: {tenant.lineUser?.displayName || 'เชื่อมต่อแล้ว'}
                              </p>
                            )}
                            {tenant.moveInDate && (
                              <p>
                                📅 เข้าอยู่: {new Date(tenant.moveInDate).toLocaleDateString('th-TH')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tenant.status === 'active' && (
                          <button
                            onClick={() => handleMoveOut(tenant)}
                            className="inline-flex items-center px-3 py-1 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            ย้ายออก
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(tenant)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleResetPassword(tenant)}
                          className="inline-flex items-center px-3 py-1 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          title="รีเซ็ตรหัสผ่าน"
                        >
                          🔑 รีเซ็ต
                        </button>
                        <button
                          onClick={() => handleDelete(tenant)}
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
                  {editingTenant ? 'แก้ไขผู้เช่า' : 'เพิ่มผู้เช่าใหม่'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        อีเมล *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        เบอร์โทร *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="lineUserId" className="block text-sm font-medium text-gray-700">
                        LINE User (ที่ยังไม่ได้เชื่อมต่อ)
                      </label>
                      <select
                        id="lineUserId"
                        value={formData.lineUserId}
                        onChange={(e) => setFormData({ ...formData, lineUserId: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">-- ไม่ระบุ / เชื่อมต่อภายหลัง --</option>
                        {editingTenant?.lineUserId && (
                          <option value={editingTenant.lineUserId}>
                            (ปัจจุบัน) {editingTenant.lineUser?.displayName || editingTenant.lineUserId}
                          </option>
                        )}
                        {unlinkedUsers.map((user) => (
                          <option key={user.lineUserId} value={user.lineUserId}>
                            {user.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="idCardNumber" className="block text-sm font-medium text-gray-700">
                        เลขบัตรประชาชน *
                      </label>
                      <input
                        type="text"
                        id="idCardNumber"
                        required
                        value={formData.idCardNumber}
                        onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                        วันเกิด
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
                        อาชีพ
                      </label>
                      <input
                        type="text"
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">
                        วันที่เข้าอยู่
                      </label>
                      <input
                        type="date"
                        id="moveInDate"
                        value={formData.moveInDate}
                        onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                      ห้องพัก
                    </label>
                    <select
                      id="roomId"
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">เลือกห้องพัก</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          ห้อง {room.roomNumber} - {room.building.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                        ผู้ติดต่อฉุกเฉิน
                      </label>
                      <input
                        type="text"
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
                        เบอร์ติดต่อฉุกเฉิน
                      </label>
                      <input
                        type="tel"
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingTenant(null);
                        setFormData({
                          fullName: '',
                          email: '',
                          phone: '',
                          lineUserId: '',
                          idCardNumber: '',
                          dateOfBirth: '',
                          occupation: '',
                          emergencyContact: '',
                          emergencyPhone: '',
                          moveInDate: '',
                          roomId: '',
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
                      {editingTenant ? 'บันทึก' : 'เพิ่ม'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {resetPasswordModal.show && resetPasswordModal.newPassword && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <span className="text-3xl">🔑</span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  รีเซ็ตรหัสผ่านสำเร็จ
                </h3>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">ผู้เช่า:</p>
                  <p className="font-bold text-lg text-gray-900">{resetPasswordModal.tenant?.fullName}</p>

                  <p className="text-sm text-gray-600 mt-4 mb-2">รหัสผ่านใหม่:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <code className="text-2xl font-mono font-bold text-primary-600 bg-white px-4 py-3 rounded-lg border-2 border-primary-300">
                      {resetPasswordModal.newPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(resetPasswordModal.newPassword!)}
                      className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold"
                      title="คัดลอก"
                    >
                      📋 คัดลอก
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    ⚠️ กรุณาแจ้งรหัสผ่านนี้ให้ผู้เช่าทราบ และแนะนำให้เปลี่ยนรหัสผ่านใหม่หลังจากเข้าสู่ระบบ
                  </p>
                </div>
                <button
                  onClick={() => setResetPasswordModal({ show: false, tenant: null, newPassword: null })}
                  className="mt-6 w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


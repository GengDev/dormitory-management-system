/**
 * Admin Buildings Page
 *
 * หน้าจัดการอาคารสำหรับ admin
 *
 * @module app/admin/buildings/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface Building {
  id: string;
  name: string;
  address: string | null;
  totalFloors: number;
  isActive: boolean;
  _count: {
    rooms: number;
  };
}

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    totalFloors: 1,
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await api.getBuildings();
      setBuildings(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBuilding) {
        // Update building
        await api.updateBuilding(editingBuilding.id, formData);
      } else {
        // Create building
        await api.createBuilding(formData);
      }

      setShowAddModal(false);
      setEditingBuilding(null);
      setFormData({ name: '', address: '', totalFloors: 1 });
      fetchBuildings();
    } catch (error: any) {
      console.error('Failed to save building:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      address: building.address || '',
      totalFloors: building.totalFloors,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (building: Building) => {
    if (!confirm(`ต้องการลบอาคาร "${building.name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.deleteBuilding(building.id);
      fetchBuildings();
    } catch (error: any) {
      console.error('Failed to delete building:', error);
      alert('ไม่สามารถลบอาคารได้ อาจมีห้องอยู่ในอาคารนี้');
    }
  };

  const toggleActive = async (building: Building) => {
    try {
      await api.updateBuilding(building.id, {
        isActive: !building.isActive,
      });
      fetchBuildings();
    } catch (error: any) {
      console.error('Failed to toggle building status:', error);
    }
  };

  return (
    <AdminLayout title="จัดการอาคาร">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">อาคารทั้งหมด</h2>
            <p className="mt-1 text-sm text-gray-600">
              จัดการข้อมูลอาคารและจำนวนชั้น
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBuilding(null);
              setFormData({ name: '', address: '', totalFloors: 1 });
              setShowAddModal(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            ➕ เพิ่มอาคาร
          </button>
        </div>

        {/* Buildings List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          ) : buildings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ยังไม่มีข้อมูลอาคาร</div>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {buildings.map((building) => (
                <li key={building.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {building.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {building.name}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                building.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {building.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>ที่อยู่: {building.address || 'ไม่ได้ระบุ'}</p>
                            <p>จำนวนชั้น: {building.totalFloors} ชั้น</p>
                            <p>จำนวนห้อง: {building._count.rooms} ห้อง</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(building)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            building.isActive
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {building.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                        <button
                          onClick={() => handleEdit(building)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(building)}
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
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingBuilding ? 'แก้ไขอาคาร' : 'เพิ่มอาคารใหม่'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      ชื่ออาคาร *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      ที่อยู่
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="totalFloors" className="block text-sm font-medium text-gray-700">
                      จำนวนชั้น *
                    </label>
                    <input
                      type="number"
                      id="totalFloors"
                      min="1"
                      required
                      value={formData.totalFloors}
                      onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingBuilding(null);
                        setFormData({ name: '', address: '', totalFloors: 1 });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {editingBuilding ? 'บันทึก' : 'เพิ่ม'}
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


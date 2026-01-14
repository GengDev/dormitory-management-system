/**
 * Admin Rooms Page
 *
 * หน้าจัดการห้องสำหรับ admin
 *
 * @module app/admin/rooms/page
 */

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

interface Room {
  id: string;
  roomNumber: string;
  floorNumber: number;
  roomType: string;
  monthlyRent: number;
  deposit: number;
  areaSqm: number;
  maxOccupancy: number;
  status: string;
  description: string;
  amenities: string[];
  building: {
    id: string;
    name: string;
    address: string;
  };
  tenants: Array<{
    id: string;
    fullName: string;
  }>;
}

interface Building {
  id: string;
  name: string;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    buildingId: '',
    roomNumber: '',
    floorNumber: 1,
    roomType: 'single',
    monthlyRent: 0,
    deposit: 0,
    areaSqm: 0,
    maxOccupancy: 1,
    description: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    fetchRooms();
    fetchBuildings();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.getRooms();
      setRooms(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await api.getBuildings();
      setBuildings(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch buildings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRoom) {
        // Update room
        await api.updateRoom(editingRoom.id, formData);
      } else {
        // Create room
        await api.createRoom(formData);
      }

      setShowAddModal(false);
      setEditingRoom(null);
      setFormData({
        buildingId: '',
        roomNumber: '',
        floorNumber: 1,
        roomType: 'single',
        monthlyRent: 0,
        deposit: 0,
        areaSqm: 0,
        maxOccupancy: 1,
        description: '',
        amenities: [],
      });
      fetchRooms();
    } catch (error: any) {
      console.error('Failed to save room:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      buildingId: room.building.id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      roomType: room.roomType,
      monthlyRent: room.monthlyRent,
      deposit: room.deposit,
      areaSqm: room.areaSqm || 0,
      maxOccupancy: room.maxOccupancy,
      description: room.description || '',
      amenities: room.amenities || [],
    });
    setShowAddModal(true);
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`ต้องการลบห้อง "${room.roomNumber}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.deleteRoom(room.id);
      fetchRooms();
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      alert('ไม่สามารถลบห้องได้ อาจมีผู้เช่าอยู่ในห้องนี้');
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'ว่าง';
      case 'occupied':
        return 'เช่าแล้ว';
      case 'maintenance':
        return 'ซ่อมบำรุง';
      default:
        return status;
    }
  };

  const availableAmenities = [
    'wifi', 'aircon', 'fridge', 'tv', 'water_heater',
    'kitchen', 'balcony', 'parking', 'gym', 'pool'
  ];

  return (
    <AdminLayout title="จัดการห้อง">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ห้องทั้งหมด</h2>
            <p className="mt-1 text-sm text-gray-600">
              จัดการข้อมูลห้องพักและสถานะ
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRoom(null);
              setFormData({
                buildingId: '',
                roomNumber: '',
                floorNumber: 1,
                roomType: 'single',
                monthlyRent: 0,
                deposit: 0,
                areaSqm: 0,
                maxOccupancy: 1,
                description: '',
                amenities: [],
              });
              setShowAddModal(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            ➕ เพิ่มห้อง
          </button>
        </div>

        {/* Rooms List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ยังไม่มีข้อมูลห้อง</div>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {rooms.map((room) => (
                <li key={room.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            room.status === 'available' ? 'bg-green-100' :
                            room.status === 'occupied' ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                            <span className={`font-medium ${
                              room.status === 'available' ? 'text-green-600' :
                              room.status === 'occupied' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {room.roomNumber}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              ห้อง {room.roomNumber}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}
                            >
                              {getStatusText(room.status)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>{room.building.name} - ชั้น {room.floorNumber}</p>
                            <p>ค่าเช่า: ฿{room.monthlyRent?.toLocaleString() || '0'}/เดือน</p>
                            <p>ประเภท: {room.roomType} - สูงสุด {room.maxOccupancy} คน</p>
                            {room.tenants.length > 0 && (
                              <p className="text-red-600">
                                ผู้เช่า: {room.tenants.map(t => t.fullName).join(', ')}
                              </p>
                            )}
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {room.amenities.map((amenity) => (
                                <span
                                  key={amenity}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(room)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(room)}
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
            <div className="relative top-20 mx-auto p-5 border w-96 max-h-[80vh] overflow-y-auto shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingRoom ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="buildingId" className="block text-sm font-medium text-gray-700">
                      อาคาร *
                    </label>
                    <select
                      id="buildingId"
                      required
                      value={formData.buildingId}
                      onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">เลือกอาคาร</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">
                        หมายเลขห้อง *
                      </label>
                      <input
                        type="text"
                        id="roomNumber"
                        required
                        value={formData.roomNumber}
                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="floorNumber" className="block text-sm font-medium text-gray-700">
                        ชั้น *
                      </label>
                      <input
                        type="number"
                        id="floorNumber"
                        min="1"
                        required
                        value={formData.floorNumber}
                        onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="roomType" className="block text-sm font-medium text-gray-700">
                        ประเภทห้อง *
                      </label>
                      <select
                        id="roomType"
                        required
                        value={formData.roomType}
                        onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="single">ห้องเดี่ยว</option>
                        <option value="double">ห้องคู่</option>
                        <option value="suite">ห้องสวีท</option>
                        <option value="studio">สตูดิโอ</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="maxOccupancy" className="block text-sm font-medium text-gray-700">
                        สูงสุด *
                      </label>
                      <input
                        type="number"
                        id="maxOccupancy"
                        min="1"
                        required
                        value={formData.maxOccupancy}
                        onChange={(e) => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700">
                        ค่าเช่า/เดือน *
                      </label>
                      <input
                        type="number"
                        id="monthlyRent"
                        min="0"
                        required
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="deposit" className="block text-sm font-medium text-gray-700">
                        มัดจำ
                      </label>
                      <input
                        type="number"
                        id="deposit"
                        min="0"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="areaSqm" className="block text-sm font-medium text-gray-700">
                      พื้นที่ (ตร.ม.)
                    </label>
                    <input
                      type="number"
                      id="areaSqm"
                      min="0"
                      step="0.01"
                      value={formData.areaSqm}
                      onChange={(e) => setFormData({ ...formData, areaSqm: parseFloat(e.target.value) })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      คำอธิบาย
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สิ่งอำนวยความสะดวก
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {amenity.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingRoom(null);
                        setFormData({
                          buildingId: '',
                          roomNumber: '',
                          floorNumber: 1,
                          roomType: 'single',
                          monthlyRent: 0,
                          deposit: 0,
                          areaSqm: 0,
                          maxOccupancy: 1,
                          description: '',
                          amenities: [],
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
                      {editingRoom ? 'บันทึก' : 'เพิ่ม'}
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


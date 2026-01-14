/**
 * Tenant Maintenance Page
 *
 * หน้าจอแจ้งซ่อมสำหรับผู้เช่า
 *
 * @module app/dashboard/maintenance/page
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/auth';

interface MaintenanceRequest {
  id: string;
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
}

export default function TenantMaintenancePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    images: [] as File[],
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getMaintenanceRequests();
      setRequests(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('category', formData.category);

      // Append images
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      await api.createTenantMaintenanceRequest(formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'other',
        images: [],
      });
      fetchRequests();
      alert('ส่งคำขอแจ้งซ่อมเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Failed to submit maintenance request:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำขอ');
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData({ ...formData, images: files });
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">แจ้งซ่อม</h1>
              <p className="mt-1 text-sm text-gray-600">
                แจ้งปัญหาและขอรับบริการซ่อมบำรุง
              </p>
            </div>
            <button
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  priority: 'medium',
                  category: 'other',
                  images: [],
                });
                setShowAddModal(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              ➕ แจ้งซ่อม
            </button>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-yellow-800 truncate">
                    รอดำเนินการ
                  </dt>
                  <dd className="text-lg font-medium text-yellow-900">
                    {pendingCount}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🔧</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-blue-800 truncate">
                    กำลังดำเนินการ
                  </dt>
                  <dd className="text-lg font-medium text-blue-900">
                    {inProgressCount}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-green-800 truncate">
                    เสร็จสิ้น
                  </dt>
                  <dd className="text-lg font-medium text-green-900">
                    {completedCount}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-800 truncate">
                    รวมทั้งหมด
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requests.length}
                  </dd>
                </div>
              </div>
            </div>
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
              <div className="text-gray-500">ยังไม่มีการแจ้งซ่อม</div>
              <p className="text-sm text-gray-400 mt-2">
                กดปุ่ม "แจ้งซ่อม" เพื่อส่งคำขอซ่อมบำรุง
              </p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {requests.map((request) => (
                <li key={request.id}>
                  <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${request.status === 'completed' ? 'bg-green-100' :
                              request.status === 'in_progress' ? 'bg-blue-100' :
                                request.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                            }`}>
                            <span className={`font-medium text-sm ${request.status === 'completed' ? 'text-green-600' :
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
                            {request.notes && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>หมายเหตุจากทีมซ่อม:</strong> {request.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  แจ้งซ่อม
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      หัวข้อปัญหา *
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="เช่น ไฟห้องน้ำไม่ติด, ประตูห้องน้ำล็อกไม่สนิท"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      หมวดหมู่ *
                    </label>
                    <select
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="electrical">ไฟฟ้า</option>
                      <option value="plumbing">ประปา</option>
                      <option value="structural">โครงสร้าง (กำแพง, ประตู, หน้าต่าง)</option>
                      <option value="appliance">เครื่องใช้ไฟฟ้า (แอร์, ตู้เย็น, เครื่องทำน้ำอุ่น)</option>
                      <option value="cleaning">ทำความสะอาด</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      ความเร่งด่วน *
                    </label>
                    <select
                      id="priority"
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="low">ต่ำ - ไม่กระทบการใช้งาน</option>
                      <option value="medium">ปานกลาง - รอได้ แต่ควรแก้ไข</option>
                      <option value="high">สูง - มีผลต่อการใช้งาน</option>
                      <option value="urgent">ด่วนที่สุด - ต้องการแก้ไขทันที</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      รายละเอียดเพิ่มเติม *
                    </label>
                    <textarea
                      id="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="อธิบายปัญหาให้ละเอียดที่สุด เพื่อให้ทีมซ่อมเข้าใจและแก้ไขได้อย่างถูกต้อง"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="images" className="block text-sm font-medium text-gray-700">
                      รูปภาพ (ถ้ามี)
                    </label>
                    <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      สามารถอัปโหลดได้หลายรูป สูงสุด 5 รูป
                    </p>
                    {formData.images.length > 0 && (
                      <p className="mt-1 text-sm text-green-600">
                        เลือกแล้ว {formData.images.length} รูป
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                      💡 หลังจากส่งคำขอแล้ว ทีมงานจะติดต่อกลับทาง LINE
                      และแจ้งกำหนดการซ่อมให้ทราบ
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setFormData({
                          title: '',
                          description: '',
                          priority: 'medium',
                          category: 'other',
                          images: [],
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
                      ส่งคำขอ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


/**
 * Admin Dashboard Page
 *
 * หน้าแดชบอร์ดหลักสำหรับ admin
 *
 * @module app/admin/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Building2,
  Home,
  CheckCircle2,
  DoorOpen,
  Users,
  Wallet,
  AlertTriangle,
  Wrench,
  TrendingUp,
  Activity,
  PlusCircle,
  FileText,
  BarChart3
} from 'lucide-react';

interface Stats {
  totalBuildings: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalTenants: number;
  pendingBills: number;
  overdueBills: number;
  pendingMaintenance: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      router.push('/login');
      return;
    }

    if (!dataFetched) {
      fetchDashboardData();
    }
  }, [dataFetched, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch data in parallel for better performance
      const [buildingsRes, roomsRes, tenantsRes, billsRes, maintenanceRes] = await Promise.allSettled([
        api.getBuildings(),
        api.getRooms(),
        api.getTenants(),
        api.getBills({ status: 'pending' }),
        api.getMaintenanceRequests({ status: 'pending' }),
      ]);

      // Extract results with fallbacks
      const buildings = buildingsRes.status === 'fulfilled' ? buildingsRes.value.data?.data || [] : [];
      const rooms = roomsRes.status === 'fulfilled' ? roomsRes.value.data?.data || [] : [];
      const tenants = tenantsRes.status === 'fulfilled' ? tenantsRes.value.data?.data || [] : [];
      const bills = billsRes.status === 'fulfilled' ? billsRes.value.data?.data || [] : [];
      const maintenance = maintenanceRes.status === 'fulfilled' ? maintenanceRes.value.data?.data || [] : [];

      // Calculate stats
      const totalBuildings = buildings.length;
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((room: any) => room.status === 'occupied').length;
      const availableRooms = rooms.filter((room: any) => room.status === 'available').length;
      const totalTenants = tenants.length;
      const pendingBills = bills.length;
      const overdueBills = bills.filter((bill: any) => {
        const dueDate = new Date(bill.dueDate);
        return dueDate < new Date();
      }).length;
      const pendingMaintenance = maintenance.length;

      setStats({
        totalBuildings,
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalTenants,
        pendingBills,
        overdueBills,
        pendingMaintenance,
      });

      // Mock recent activities (in real app, fetch from audit log)
      setRecentActivities([
        {
          id: '1',
          type: 'tenant_added',
          description: 'เพิ่มผู้เช่าใหม่: สมชาย ใจดี',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'bill_created',
          description: 'สร้างบิลเดือนมกราคม สำหรับห้อง A-101',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'payment_received',
          description: 'รับการชำระเงิน ฿6,210 จาก สมชาย ใจดี',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setDataFetched(true);
    }
  };

  const statCards = [
    {
      name: 'อาคาร',
      value: stats?.totalBuildings || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'ห้องทั้งหมด',
      value: stats?.totalRooms || 0,
      icon: Home,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'ห้องถูกเช่า',
      value: stats?.occupiedRooms || 0,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'ห้องว่าง',
      value: stats?.availableRooms || 0,
      icon: DoorOpen,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'ผู้เช่า',
      value: stats?.totalTenants || 0,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'บิลรอชำระ',
      value: stats?.pendingBills || 0,
      icon: Wallet,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'บิลค้างชำระ',
      value: stats?.overdueBills || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'แจ้งซ่อม',
      value: stats?.pendingMaintenance || 0,
      icon: Wrench,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  // Mock data for chart
  const revenueData = [
    { name: 'ม.ค.', revenue: 45000, occupancy: 85 },
    { name: 'ก.พ.', revenue: 52000, occupancy: 88 },
    { name: 'มี.ค.', revenue: 48000, occupancy: 86 },
    { name: 'เม.ย.', revenue: 61000, occupancy: 92 },
    { name: 'พ.ค.', revenue: 55000, occupancy: 90 },
    { name: 'มิ.ย.', revenue: 67000, occupancy: 95 },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-8 rounded w-16"></div>
                        ) : (
                          stat.value.toLocaleString()
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                แนวโน้มรายได้
              </h3>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +12.5% vs เดือนที่แล้ว
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                อัตราการเข้าพัก (%)
              </h3>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                ยอดนิยม: เดือน มิ.ย.
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#6366f1"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={2500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              กิจกรรมล่าสุด
            </h3>
          </div>
          <div className="px-6 py-5">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {recentActivities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-5 -ml-px h-full w-0.5 bg-gray-100"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-4">
                        <div>
                          <span className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center ring-8 ring-white">
                            <Activity className="w-5 h-5 text-primary-600" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              บันทึกโดยระบบอัตโนมัติ
                            </p>
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            การดำเนินการด่วน
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow-md transition-all group">
              <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              สร้างบิลรายเดือน
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
              ดูรายงานทั้งหมด
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all">
              <PlusCircle className="w-5 h-5 mr-2 text-green-600" />
              เพิ่มผู้เช่าใหม่
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


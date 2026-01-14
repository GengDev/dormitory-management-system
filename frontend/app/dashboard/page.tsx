/**
 * Tenant Dashboard Page
 *
 * หน้าแดชบอร์ดสำหรับผู้เช่า
 *
 * @module app/dashboard/page
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ArrowRight,
  MessageSquare,
  FileText,
  Clock,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Bill {
  id: string;
  billNumber: string;
  billingMonth: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface Maintenance {
  id: string;
  title: string;
  status: string;
  reportedAt: string;
}

export default function TenantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
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
      if (user.role !== 'tenant') {
        router.push('/admin');
        return;
      }
    } catch (error) {
      router.push('/login');
      return;
    }

    if (user?.role === 'tenant' && !dataFetched) {
      fetchDashboardData();
    }
  }, [user, dataFetched, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch data in parallel for better performance
      const [billsRes, maintenanceRes] = await Promise.allSettled([
        api.getBills(),
        api.getMaintenanceRequests(),
      ]);

      // Extract results with fallbacks
      const billsData = billsRes.status === 'fulfilled' ? billsRes.value.data?.data || [] : [];
      const maintenanceData = maintenanceRes.status === 'fulfilled' ? maintenanceRes.value.data?.data || [] : [];

      setBills(billsData);
      setMaintenance(maintenanceData);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setDataFetched(true);
    }
  };

  const pendingBills = bills.filter((bill) => bill.status === 'pending');
  const overdueBills = bills.filter((bill) => {
    const dueDate = new Date(bill.dueDate);
    return bill.status === 'pending' && dueDate < new Date();
  });
  const pendingMaintenance = maintenance.filter((m) => m.status === 'pending');

  return (
    <Layout title={`ยินดีต้อนรับคุณ ${user?.fullName}`}>
      <div className="space-y-8 pb-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary-600 group-hover:scale-110 transition-transform">
              <Wallet size={60} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">บิลรอชำระ</p>
              <h2 className="text-3xl font-black text-gray-900">{loading ? '...' : pendingBills.length}</h2>
              <div className="mt-4 flex items-center text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg w-fit">
                <Clock size={12} className="mr-1" />
                สถานะปกติ
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600 group-hover:scale-110 transition-transform">
              <AlertTriangle size={60} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">บิลค้างชำระ</p>
              <h2 className="text-3xl font-black text-red-500">{loading ? '...' : overdueBills.length}</h2>
              <div className="mt-4 flex items-center text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg w-fit">
                <AlertTriangle size={12} className="mr-1" />
                กรุณาชำระโดยด่วน
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={60} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">บิลที่จ่ายแล้ว</p>
              <h2 className="text-3xl font-black text-gray-900">{loading ? '...' : bills.filter(b => b.status === 'paid').length}</h2>
              <div className="mt-4 flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                <CheckCircle2 size={12} className="mr-1" />
                ประวัติการชำระดี
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-600 group-hover:scale-110 transition-transform">
              <Wrench size={60} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">แจ้งซ่อม</p>
              <h2 className="text-3xl font-black text-gray-900">{loading ? '...' : pendingMaintenance.length}</h2>
              <div className="mt-4 flex items-center text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit">
                <TrendingUp size={12} className="mr-1" />
                กำลังดำเนินการ
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bills */}
          <div className="bg-white rounded-3xl shadow-premium border border-gray-50 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-3 text-primary-600" />
                บิลล่าสุด
              </h3>
              <Link href="/dashboard/bills" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="p-8">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-12">
                  <dl className="text-gray-400 font-bold">ไม่มีข้อมูลบิลในขณะนี้</dl>
                </div>
              ) : (
                <div className="space-y-4">
                  {bills.slice(0, 3).map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl premium-gradient flex items-center justify-center text-white shadow-md">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{bill.billNumber}</p>
                          <p className="text-xs font-bold text-gray-500">
                            เดือน {new Date(bill.billingMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">฿{bill.totalAmount.toLocaleString()}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${bill.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' :
                            bill.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                              'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {bill.status === 'paid' ? 'ชำระแล้ว' : bill.status === 'pending' ? 'รอชำระ' : 'เกินกำหนด'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Service Actions */}
          <div className="space-y-8">
            <div className="bg-primary-600 rounded-[2rem] p-8 text-white shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
                <MessageSquare size={100} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-2">ต้องการความช่วยเหลือ?</h3>
                <p className="text-primary-100 font-medium mb-6">คุณสามารถติดต่อแอดมินหรือศูนย์จัดการหอพักได้ตลอดเวลาผ่านระบบแชทอัจฉริยะ</p>
                <Link
                  href="/chat"
                  className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-sm"
                >
                  เริ่มแชทตอนนี้
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Link href="/dashboard/maintenance" className="bg-white p-6 rounded-3xl shadow-premium border border-gray-50 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                  <Wrench size={24} />
                </div>
                <h4 className="font-black text-gray-900 mb-1">แจ้งซ่อม</h4>
                <p className="text-xs font-bold text-gray-400">ส่งคำขอบริการใหม่</p>
              </Link>

              <Link href="/dashboard/bills" className="bg-white p-6 rounded-3xl shadow-premium border border-gray-50 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h4 className="font-black text-gray-900 mb-1">ใบแจ้งหนี้</h4>
                <p className="text-xs font-bold text-gray-400">ดูรายการบิลทั้งหมด</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

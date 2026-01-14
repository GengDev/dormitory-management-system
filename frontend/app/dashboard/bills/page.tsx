/**
 * Tenant Bills Page
 *
 * หน้าดูบิลสำหรับผู้เช่า
 *
 * @module app/dashboard/bills/page
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import {
  FileText,
  Wallet,
  AlertTriangle,
  Search,
  Upload,
  History,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Info,
  Building2,
  PlusCircle,
  CreditCard
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import SuccessState from '@/components/SuccessState';
import { motion, AnimatePresence } from 'framer-motion';

interface Bill {
  id: string;
  billingMonth: string;
  billingYear: number;
  rentAmount: number;
  waterUsage: number;
  waterRate: number;
  waterAmount: number;
  electricityUsage: number;
  electricityRate: number;
  electricityAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paymentDate: string;
  createdAt: string;
  room: {
    roomNumber: string;
    building: {
      name: string;
    };
  };
}

export default function TenantBillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [filterStatus]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.getBills(params);
      setBills(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.totalAmount,
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBill) return;

    setUploading(true);
    try {
      let receiptUrl = '';

      // 1. Upload file if selected
      if (selectedFile) {
        const uploadRes = await api.uploadReceipt(selectedFile);
        receiptUrl = uploadRes.data.data.url;
      }

      // 2. Submit payment with receipt URL
      await api.submitTenantPayment({
        billId: selectedBill.id,
        ...paymentData,
        receiptUrl,
      });

      setShowPaymentModal(false);
      setSelectedBill(null);
      setSelectedFile(null);
      setPaymentData({
        amount: 0,
        paymentMethod: 'bank_transfer',
        referenceNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchBills();
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Failed to submit payment:', error);
      alert('เกิดข้อผิดพลาดในการส่งหลักฐาน: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 mr-1" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 mr-1" />;
      default:
        return <Info className="w-4 h-4 mr-1" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอชำระ';
      case 'paid':
        return 'ชำระแล้ว';
      case 'overdue':
        return 'เกินกำหนด';
      default:
        return status;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[month - 1];
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

  const totalOwed = bills
    .filter(bill => bill.status !== 'paid')
    .reduce((sum, bill) => sum + bill.totalAmount, 0);

  const overdueCount = bills.filter(bill => bill.status === 'overdue').length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">บิลของฉัน</h1>
            <p className="mt-1 text-gray-500 font-medium tracking-tight">จัดการค่าเช่าและค่าสาธารณูปโภคของคุณในที่เดียว</p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl shadow-premium border border-gray-50">
            {['all', 'pending', 'overdue', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === status
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {status === 'all' ? 'ทั้งหมด' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="premium-gradient rounded-3xl p-6 text-white shadow-premium relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Wallet size={80} className="text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">ยอดที่ต้องชำระ (รวม)</p>
              <h2 className="text-4xl font-black">฿{totalOwed.toLocaleString()}</h2>
              <div className="mt-4 flex items-center text-[10px] font-bold bg-white bg-opacity-20 px-2 py-1 rounded-lg w-fit backdrop-blur-sm">
                <Info size={12} className="mr-1" />
                กรุณาชำระให้ตรงเวลาเพื่อเลี่ยงค่าปรับ
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600 group-hover:scale-110 transition-transform">
              <AlertTriangle size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">บิลค้างชำระ</p>
              <h2 className="text-4xl font-black text-red-500">{overdueCount} <span className="text-lg font-bold opacity-50">รายการ</span></h2>
              <div className="mt-4 flex items-center text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg w-fit">
                <AlertTriangle size={12} className="mr-1" />
                เกินกำหนดชำระ
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary-600 group-hover:scale-110 transition-transform">
              <Building2 size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ข้อมูลห้องพัก</p>
              <h2 className="text-4xl font-black text-gray-800">{bills[0]?.room.roomNumber || '-'}</h2>
              <div className="mt-4 flex items-center text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg w-fit">
                <Building2 size={12} className="mr-1" />
                {bills[0]?.room.building.name || '-'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-primary-600" />
            รายการบิลทั้งหมด
          </h3>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-3xl shadow-sm"></div>
              ))}
            </div>
          ) : bills.length === 0 ? (
            <EmptyState
              icon={Search}
              title="ไม่พบข้อมูลบิล"
              description="เราไม่พบบัญชีบิลในระบบสำหรับเงื่อนไขนี้"
              action={
                <button
                  onClick={() => setFilterStatus('all')}
                  className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  ดูบิลทั้งหมด
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {bills.map((bill) => (
                  <motion.div
                    key={bill.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl p-6 shadow-premium border border-gray-50 hover:shadow-xl transition-all group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-lg ${bill.status === 'paid' ? 'premium-gradient' :
                          bill.status === 'overdue' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                            'bg-gradient-to-br from-yellow-400 to-orange-500'
                          }`}>
                          <span className="text-[10px] uppercase opacity-70">ยอดเดือน</span>
                          <span className="text-xl leading-none">{bill.billingMonth}</span>
                          <span className="text-[10px] opacity-70 mt-1">{bill.billingYear}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-black text-gray-900">฿{bill.totalAmount.toLocaleString()}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border group-hover:scale-105 transition-transform ${getStatusColor(bill.status)}`}>
                              {getStatusIcon(bill.status)}
                              {getStatusText(bill.status)}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-400 flex items-center">
                            <Clock size={14} className="mr-1.5" />
                            ครบกำหนด: {new Date(bill.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="hidden xl:grid grid-cols-3 gap-6 text-center border-l border-gray-100 pl-6 h-12 items-center">
                        <div className="px-4 border-r border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">ค่าเช่า</p>
                          <p className="text-sm font-black text-gray-700">฿{bill.rentAmount.toLocaleString()}</p>
                        </div>
                        <div className="px-4 border-r border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">ค่าน้ำ</p>
                          <p className="text-sm font-black text-blue-600">฿{bill.waterAmount.toLocaleString()}</p>
                        </div>
                        <div className="px-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">ค่าไฟ</p>
                          <p className="text-sm font-black text-orange-500">฿{bill.electricityAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto lg:ml-0">
                        <button
                          onClick={() => { }} // TODO: Detail view
                          className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="ดูรายละเอียดบิล"
                        >
                          <Eye size={20} />
                        </button>

                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handlePayment(bill)}
                            className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-premium hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <CreditCard size={18} />
                            ชำระเงิน
                          </button>
                        )}

                        {bill.status === 'paid' && (
                          <div className="flex items-center text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl text-sm border border-green-100">
                            <CheckCircle2 size={16} className="mr-2" />
                            เรียบร้อย
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPaymentModal && selectedBill && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="premium-gradient p-8 text-white relative">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                >
                  <XCircle size={24} />
                </button>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">ยืนยันการชำระเงิน</p>
                <h2 className="text-3xl font-black">แจ้งโอนเงิน</h2>
                <div className="mt-6 flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-70">ยอดที่ต้องชำระ</p>
                    <p className="text-2xl font-black">฿{selectedBill.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase opacity-70">บิลเดือน</p>
                    <p className="text-lg font-bold">{getMonthName(Number(selectedBill.billingMonth))} {selectedBill.billingYear}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">วิธีการชำระ *</label>
                      <select
                        required
                        value={paymentData.paymentMethod}
                        onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 transition-all"
                      >
                        <option value="bank_transfer">โอนเงินเข้าบัญชี</option>
                        <option value="promptpay">สแกนพร้อมเพย์</option>
                        <option value="cash">จ่ายเงินสด</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">วันที่ชำระ *</label>
                      <input
                        type="date"
                        required
                        value={paymentData.paymentDate}
                        onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">เลขที่อ้างอิง (ถ้ามี)</label>
                    <input
                      type="text"
                      value={paymentData.referenceNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                      placeholder="เช่น เลขที่รายการจากแอปธนาคาร"
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-500 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">หลักฐานการแจ้งโอน *</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl hover:bg-gray-100 hover:border-primary-300 transition-all cursor-pointer group">
                      {selectedFile ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="text-green-500 w-6 h-6" />
                          <span className="text-sm font-bold text-gray-700">{selectedFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 group-hover:text-primary-400 transition-colors mb-2" />
                          <span className="text-xs font-bold text-gray-400 group-hover:text-primary-500">คลิกหรือลากไฟล์สลิปมาวางที่นี่</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                    <p className="text-[10px] text-primary-700 font-bold leading-relaxed">
                      💡 ข้อมูลที่ส่งจะเข้าระบบออโต้ทันที แอดมินจะใช้เวลาสั้นที่สุดในการตรวจสอบ (ปกติไม่เกิน 1 ชม.) ผู้เช่าจะได้รับแจ้งเตือนผ่าน LINE เมื่อชำระเรียบร้อย
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full premium-gradient text-white py-5 rounded-3xl font-black text-lg shadow-premium hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังส่งข้อมูล...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={24} />
                        ส่งหลักฐานทันที
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccess && (
          <SuccessState
            title="แจ้งชำระเงินสำเร็จ!"
            description="เราได้รับข้อมูลของคุณแล้ว แอดมินกำลังตรวจสอบและจะแจ้งผลผ่าน LINE ทันทีครับ"
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}

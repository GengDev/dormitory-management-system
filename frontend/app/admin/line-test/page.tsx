'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

export default function LineTestPage() {
    const [lineUserId, setLineUserId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await api.post('/api/line/send-message', {
                lineUserId,
                message
            });

            setResult(`✅ ส่งข้อความสำเร็จ!`);
            setMessage('');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            setResult(`❌ เกิดข้อผิดพลาด: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const sendTestBillNotification = async () => {
        if (!lineUserId) {
            alert('กรุณาใส่ LINE User ID');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // ส่งข้อความทดสอบแจ้งเตือนบิล
            await api.post('/api/line/send-message', {
                lineUserId,
                message: `🧾 แจ้งเตือนบิลใหม่

📅 เดือน: มกราคม 2568
💰 ยอดรวม: 3,500 บาท
📆 ครบกำหนด: 5 ม.ค. 2568

กรุณาชำระภายในกำหนด
ดูรายละเอียด: https://dormitory.example.com/bills`
            });

            setResult(`✅ ส่งข้อความทดสอบบิลสำเร็จ!`);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            setResult(`❌ เกิดข้อผิดพลาด: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="ทดสอบส่งข้อความ LINE">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        ทดสอบส่งข้อความไปไลน์
                    </h2>
                    <p className="text-sm text-gray-600">
                        ใช้หน้านี้เพื่อทดสอบการส่งข้อความไปยัง LINE Official Account
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">📝 วิธีหา LINE User ID</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>เพิ่ม LINE Official Account เป็นเพื่อน</li>
                        <li>ส่งข้อความอะไรก็ได้ไปที่ Bot</li>
                        <li>ดู LINE User ID ในฐานข้อมูล (ตาราง <code className="bg-blue-100 px-1 rounded">LineUser</code>)</li>
                        <li>หรือดูใน LINE Developers Console → Messaging API → Webhook logs</li>
                    </ol>
                </div>

                {/* Send Message Form */}
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        <div>
                            <label htmlFor="lineUserId" className="block text-sm font-medium text-gray-700 mb-1">
                                LINE User ID *
                            </label>
                            <input
                                type="text"
                                id="lineUserId"
                                value={lineUserId}
                                onChange={(e) => setLineUserId(e.target.value)}
                                placeholder="U1234567890abcdef..."
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                ตัวอย่าง: U1234567890abcdef1234567890abcdef
                            </p>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                ข้อความ *
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                                required
                                rows={4}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'กำลังส่ง...' : '📤 ส่งข้อความ'}
                            </button>

                            <button
                                type="button"
                                onClick={sendTestBillNotification}
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'กำลังส่ง...' : '🧾 ทดสอบแจ้งบิล'}
                            </button>
                        </div>
                    </form>

                    {/* Result */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-md ${result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                            {result}
                        </div>
                    )}
                </div>

                {/* Quick Commands */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-3">⚡ คำสั่งที่ผู้ใช้สามารถส่งมาได้</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="border border-gray-200 rounded p-3">
                            <code className="text-primary-600 font-medium">ดูบิล</code>
                            <p className="text-gray-600 text-xs mt-1">ดูรายการบิลทั้งหมด</p>
                        </div>
                        <div className="border border-gray-200 rounded p-3">
                            <code className="text-primary-600 font-medium">ค้างชำระ</code>
                            <p className="text-gray-600 text-xs mt-1">ดูบิลค้างชำระ</p>
                        </div>
                        <div className="border border-gray-200 rounded p-3">
                            <code className="text-primary-600 font-medium">แจ้งซ่อม</code>
                            <p className="text-gray-600 text-xs mt-1">แจ้งซ่อมบำรุง</p>
                        </div>
                        <div className="border border-gray-200 rounded p-3">
                            <code className="text-primary-600 font-medium">ติดต่อแอดมิน</code>
                            <p className="text-gray-600 text-xs mt-1">ติดต่อเจ้าหน้าที่</p>
                        </div>
                    </div>
                </div>

                {/* Environment Check */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-900 mb-2">⚙️ ตรวจสอบการตั้งค่า</h3>
                    <p className="text-sm text-yellow-800">
                        ตรวจสอบว่าไฟล์ <code className="bg-yellow-100 px-1 rounded">.env</code> ใน Backend มีค่าเหล่านี้:
                    </p>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                        <li><code className="bg-yellow-100 px-1 rounded">LINE_CHANNEL_SECRET</code></li>
                        <li><code className="bg-yellow-100 px-1 rounded">LINE_ACCESS_TOKEN</code></li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}

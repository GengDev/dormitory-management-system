/**
 * Success State Component
 * 
 * ใช้สำหรับแสดงผลเมื่อดำเนินการสำเร็จ
 */

'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessStateProps {
    title: string;
    description: string;
    onClose?: () => void;
}

export default function SuccessState({
    title,
    description,
    onClose
}: SuccessStateProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
                <div className="relative mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                    >
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </motion.div>
                    {/* Decorative bits */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-blue-400"
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="absolute top-10 -right-4 w-3 h-3 rounded-full bg-yellow-400"
                    />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 mb-8">{description}</p>

                <button
                    onClick={onClose}
                    className="w-full py-3 premium-gradient text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                    ตกลง
                </button>
            </motion.div>
        </div>
    );
}

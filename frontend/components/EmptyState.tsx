/**
 * Empty State Component
 * 
 * ใช้สำหรับแสดงผลเมื่อไม่มีข้อมูลในหน้าต่าง ๆ
 */

'use client';

import { motion } from 'framer-motion';
import { LucideIcon, Search } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
}

export default function EmptyState({
    icon: Icon = Search,
    title,
    description,
    action
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center glass-card rounded-3xl"
        >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-8">{description}</p>
            {action && (
                <div className="flex justify-center">
                    {action}
                </div>
            )}
        </motion.div>
    );
}

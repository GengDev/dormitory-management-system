/**
 * Page Transition Component
 * 
 * Component สำหรับจัดการ animation ตอนเปลี่ยนหน้า
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

const variants = {
    hidden: { opacity: 0, x: 0, y: 10 },
    enter: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 0, y: -10 },
};

export default function PageTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial="hidden"
            animate="enter"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.4, type: 'easeInOut' }}
        >
            {children}
        </motion.div>
    );
}

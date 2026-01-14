/**
 * Root Layout
 *
 * Root layout component สำหรับ Next.js App Router
 *
 * @module app/layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ระบบจองหอพักและจัดการผู้เช่า',
  description: 'ระบบจัดการหอพักแบบครบวงจร พร้อมการแจ้งเตือนผ่าน LINE Official Account',
};

/**
 * Root Layout Component
 *
 * @param children - Child components
 * @returns Root layout JSX
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

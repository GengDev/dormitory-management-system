/**
 * Layout Component
 *
 * Layout พื้นฐานสำหรับหน้า tenant
 *
 * @module components/Layout
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import PageTransition from './PageTransition';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Wrench,
  User,
  LogOut,
  Building2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  Dorm Elite
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center"
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                แดชบอร์ด
              </Link>
              <Link
                href="/dashboard/bills"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                บิล
              </Link>
              <Link
                href="/dashboard/payments"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                การชำระเงิน
              </Link>
              <Link
                href="/dashboard/maintenance"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center"
              >
                <Wrench className="w-4 h-4 mr-1.5" />
                แจ้งซ่อม
              </Link>
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center border border-primary-200">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 border border-red-100 shadow-sm text-sm font-bold rounded-xl text-red-600 bg-white hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <PageTransition>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {title && (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                </div>
              )}
              {children}
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
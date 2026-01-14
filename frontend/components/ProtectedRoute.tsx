/**
 * Protected Route Component
 *
 * คอมโพเนนต์สำหรับป้องกันเส้นทางที่ต้องการการเข้าสู่ระบบ
 *
 * @module components/ProtectedRoute
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'tenant';
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  // Simple synchronous authentication check
  console.log('ProtectedRoute: checking auth for role:', requiredRole);

  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('ProtectedRoute: token exists:', !!token, 'userData exists:', !!userData);

    // Check if user is logged in
    if (!token || !userData) {
      console.log('ProtectedRoute: No token or userData, redirecting to:', fallbackPath);
      if (typeof window !== 'undefined') {
        window.location.href = fallbackPath;
      }
      return null;
    }

    // Parse user data
    const user = JSON.parse(userData);
    console.log('ProtectedRoute: User role:', user.role, 'Required role:', requiredRole);

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      const redirectPath = requiredRole === 'admin' ? '/dashboard' : '/admin';
      console.log('ProtectedRoute: Role mismatch, redirecting to:', redirectPath);
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      }
      return null;
    }

    // User is authorized
    console.log('ProtectedRoute: User authorized, rendering children');
    return <>{children}</>;
  } catch (error) {
    console.error('Auth check failed:', error);
    if (typeof window !== 'undefined') {
      window.location.href = fallbackPath;
    }
    return null;
  }
}
/**
 * Login Page
 *
 * หน้าเข้าสู่ระบบสำหรับ admin และ tenant
 *
 * @module app/login/page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'admin' | 'tenant'>('admin');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      // Redirect based on user role
      const parsedUser = JSON.parse(user);
      if (parsedUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login({
        email: formData.email,
        password: formData.password,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // Store token and user data
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.response?.status === 401) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (error.response?.status === 400) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          เข้าสู่ระบบ
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          เข้าสู่ระบบจัดการหอพัก
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* User Type Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  userType === 'admin'
                    ? 'bg-white text-primary-600 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => setUserType('tenant')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  userType === 'tenant'
                    ? 'bg-white text-primary-600 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 ผู้เช่า
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} method="post" action="#">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="กรุณาป้อนอีเมล"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="กรุณาป้อนรหัสผ่าน"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">บัญชีทดสอบ</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">Admin:</div>
                <div>Email: admin@example.com</div>
                <div>Password: admin123</div>
              </div>

              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">Tenant:</div>
                <div>Email: tenant@example.com</div>
                <div>Password: tenant123</div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              ← กลับสู่หน้าแรก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

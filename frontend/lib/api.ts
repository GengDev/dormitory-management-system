/**
 * API Client Utility
 *
 * Utility สำหรับเรียก API ของ backend
 *
 * @module lib/api/api
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data,
        });

        // Get token from localStorage (client-side only)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle common errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;

          if (status === 401 && !error.config._retry) {
            // Unauthorized - try to refresh token
            error.config._retry = true;

            if (this.isRefreshing) {
              // If already refreshing, add to queue
              return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              }).then(() => {
                return this.client(error.config);
              }).catch(err => {
                return Promise.reject(err);
              });
            }

            this.isRefreshing = true;

            try {
              console.log('Attempting token refresh...');
              const refreshToken = localStorage.getItem('refreshToken');
              if (!refreshToken) {
                throw new Error('No refresh token');
              }
              const refreshResponse = await axios.post(`${this.baseURL}/api/auth/refresh`, { refreshToken }, {
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              const { accessToken } = refreshResponse.data.data;

              // Update token in localStorage
              localStorage.setItem('token', accessToken);

              // Update Authorization header for original request
              error.config.headers.Authorization = `Bearer ${accessToken}`;

              // Process queued requests
              this.processQueue(null, accessToken);

              // Retry original request
              console.log('Token refreshed, retrying request...');
              return this.client(error.config);
            } catch (refreshError) {
              console.log('Token refresh failed, clearing tokens');
              // Refresh failed, clear tokens and let ProtectedRoute handle redirect
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
              }
              this.processQueue(refreshError, null);
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          } else if (status === 403) {
            // Forbidden
            console.error('Access denied:', data.message);
          } else if (status >= 500) {
            // Server error
            console.error('Server error:', data.message);
          }
        } else if (error.request) {
          // Network error
          console.error('Network error:', error.message);
        } else {
          // Other error
          console.error('Request error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    console.log('API login called with:', credentials);
    console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
    try {
      const response = await this.post('/api/auth/login', credentials);
      console.log('Login response:', response);
      return response;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  async register(userData: any) {
    const response = await this.post('/api/auth/register', userData);
    return response;
  }

  async logout() {
    const response = await this.post('/api/auth/logout');
    return response;
  }

  async getProfile() {
    const response = await this.get('/api/auth/profile');
    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await this.post('/api/auth/refresh', { refreshToken });
    return response;
  }

  // Buildings
  async getBuildings() {
    return this.get('/api/buildings');
  }

  async getBuilding(id: string) {
    return this.get(`/api/buildings/${id}`);
  }

  async createBuilding(data: any) {
    return this.post('/api/buildings', data);
  }

  async updateBuilding(id: string, data: any) {
    return this.put(`/api/buildings/${id}`, data);
  }

  async deleteBuilding(id: string) {
    return this.delete(`/api/buildings/${id}`);
  }

  // Rooms
  async getRooms(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/rooms${query}`);
  }

  async getRoom(id: string) {
    return this.get(`/api/rooms/${id}`);
  }

  async createRoom(data: any) {
    return this.post('/api/rooms', data);
  }

  async updateRoom(id: string, data: any) {
    return this.put(`/api/rooms/${id}`, data);
  }

  async deleteRoom(id: string) {
    return this.delete(`/api/rooms/${id}`);
  }

  // Tenants
  async getTenants(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/tenants${query}`);
  }

  async getTenant(id: string) {
    return this.get(`/api/tenants/${id}`);
  }

  async createTenant(data: any) {
    return this.post('/api/tenants', data);
  }

  async updateTenant(id: string, data: any) {
    return this.put(`/api/tenants/${id}`, data);
  }

  async deleteTenant(id: string) {
    return this.delete(`/api/tenants/${id}`);
  }

  async moveOutTenant(id: string, data: any) {
    return this.patch(`/api/tenants/${id}/move-out`, data);
  }

  async resetTenantPassword(id: string) {
    return this.patch(`/api/tenants/${id}/reset-password`);
  }

  // Bills
  async getBills(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/bills${query}`);
  }

  async getBill(id: string) {
    return this.get(`/api/bills/${id}`);
  }

  async createBill(data: any) {
    return this.post('/api/bills', data);
  }

  async updateBill(id: string, data: any) {
    return this.put(`/api/bills/${id}`, data);
  }

  async deleteBill(id: string) {
    return this.delete(`/api/bills/${id}`);
  }

  async sendBillNotification(billId: string, tenantId: string) {
    return this.post('/api/notifications/send-bill', { billId, tenantId });
  }

  async payBill(id: string, data: any) {
    return this.patch(`/api/bills/${id}/pay`, data);
  }

  async generateBulkBills(data: any) {
    return this.post('/api/bills/bulk', data);
  }

  // Payments
  async getPayments(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/payments${query}`);
  }

  async getPayment(id: string) {
    return this.get(`/api/payments/${id}`);
  }

  async approvePayment(id: string) {
    return this.patch(`/api/payments/${id}/approve`);
  }

  async rejectPayment(id: string) {
    return this.patch(`/api/payments/${id}/reject`);
  }

  // Upload
  async uploadReceipt(file: File) {
    const formData = new FormData();
    formData.append('receipt', file);
    return this.client.post('/api/upload/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Maintenance
  async getMaintenanceRequests(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/maintenance${query}`);
  }

  async getMaintenanceRequest(id: string) {
    return this.get(`/api/maintenance/${id}`);
  }

  async createMaintenanceRequest(data: any) {
    return this.post('/api/maintenance', data);
  }

  async updateMaintenanceRequest(id: string, data: any) {
    return this.patch(`/api/maintenance/${id}`, data);
  }

  // Reports
  async getReports(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/reports${query}`);
  }

  async exportReports(params?: any, config?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/reports/export${query}`, config);
  }

  // LINE Integration
  async getLineNotifications(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/line/notifications${query}`);
  }

  // Public endpoints (no auth required)
  async getPublicBuildings() {
    return axios.get(`${this.baseURL}/api/public/buildings`);
  }

  async getPublicRooms(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return axios.get(`${this.baseURL}/api/public/rooms${query}`);
  }

  // Tenant-specific endpoints
  async getTenantBills(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/tenant/bills${query}`);
  }

  async getTenantPayments(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/tenant/payments${query}`);
  }

  async submitTenantPayment(data: any) {
    return this.post('/api/tenant/payments', data);
  }

  async getTenantMaintenanceRequests() {
    return this.get('/api/tenant/maintenance');
  }

  async createTenantMaintenanceRequest(data: any, config?: any) {
    return this.post('/api/tenant/maintenance', data, config);
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }
}

// Create and export a singleton instance
const api = new ApiClient();
export { api };
export default api;

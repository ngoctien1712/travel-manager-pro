// Admin API - Replace mock implementations with real API calls

import { httpClient } from './http';
import type {
  User,
  Provider,
  PaginatedResponse,
  ListParams,
} from '@/types/dto';

// Extend ListParams for specific entities
interface UserListParams extends ListParams {
  role?: string;
  status?: string;
}

interface ProviderListParams extends ListParams {
  status?: string;
}

export const adminApi = {
  // Dashboard
  async getDashboardStats(): Promise<any> {
    return httpClient.get('/admin/dashboard-stats');
  },

  // Users
  async listUsers(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    return httpClient.get(`/admin/users?${query.toString()}`);
  },

  async getUser(id: string): Promise<User> {
    return httpClient.get(`/admin/users/${id}`);
  },

  async createUser(data: Partial<User>): Promise<User> {
    return httpClient.post('/admin/users', data);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return httpClient.patch(`/admin/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<void> {
    return httpClient.delete(`/admin/users/${id}`);
  },

  // Providers
  async listProviders(params: ProviderListParams = {}): Promise<PaginatedResponse<Provider>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    return httpClient.get(`/admin/providers?${query.toString()}`);
  },

  async updateProviderStatus(id: string, status: string): Promise<any> {
    return httpClient.patch(`/admin/providers/${id}/status`, { status });
  },

  // Payroll
  async getPayrollStats(): Promise<{ data: any[] }> {
    return httpClient.get('/admin/payroll/stats');
  },

  async getPayrollHistory(): Promise<{ data: any[] }> {
    return httpClient.get('/admin/payroll/history');
  },

  async getPaidOrdersHistory(): Promise<{ data: any[] }> {
    return httpClient.get('/admin/payroll/paid-orders');
  },

  async getProviderOrdersForPayroll(id: string): Promise<{ data: any[] }> {
    return httpClient.get(`/admin/payroll/provider/${id}/orders`);
  },

  async processPayroll(data: any): Promise<any> {
    return httpClient.post('/admin/payroll/process', data);
  },

  // Owner Activity Monitoring
  async listActivityProviders(params: { search?: string; startDate?: string; endDate?: string } = {}): Promise<{ data: any[] }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return httpClient.get(`/admin/owner-activities/providers?${query.toString()}`);
  },

  async getProviderActivityItems(id: string, params: { startDate?: string; endDate?: string } = {}): Promise<{ services: any[]; vouchers: any[] }> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return httpClient.get(`/admin/owner-activities/provider/${id}/items?${query.toString()}`);
  },

  async updateActivityItemStatus(type: 'service' | 'voucher', id: string, status: string): Promise<any> {
    return httpClient.patch(`/admin/owner-activities/items/${type}/${id}/status`, { status });
  },

  async updateActivityItemDetails(type: 'service' | 'voucher', id: string, data: any): Promise<any> {
    return httpClient.patch(`/admin/owner-activities/items/${type}/${id}`, data);
  },

  // Business Registrations
  async listPendingBusiness(): Promise<{ data: any[] }> {
    return httpClient.get('/admin/pending-business');
  },

  async approveBusiness(userId: string): Promise<any> {
    return httpClient.post(`/admin/approve-business-account/${userId}`, {});
  },

  // Refunds
  async listRefundRequests(status?: string): Promise<{ data: any[] }> {
    const query = status ? `?status=${status}` : '';
    return httpClient.get(`/admin/refunds${query}`);
  },

  async approveRefund(id: string, adminNote?: string): Promise<any> {
    return httpClient.post(`/admin/refunds/${id}/approve`, { adminNote });
  },

  async rejectRefund(id: string, adminNote: string): Promise<any> {
    return httpClient.post(`/admin/refunds/${id}/reject`, { adminNote });
  },
};

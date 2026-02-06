import { httpClient } from './http';

export interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserDetail extends AdminUser {
  profile?: {
    date?: string;
    travel_style?: string;
    business_name?: string;
    department?: string;
  };
}

export const adminUserApi = {
  listUsers: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return httpClient.get<PaginatedUsers>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  getUser: (id: string) => httpClient.get<AdminUserDetail>(`/admin/users/${id}`),

  createUser: (data: {
    email: string;
    password?: string;
    fullName?: string;
    phone?: string;
    role: string;
    status?: string;
  }) => httpClient.post<AdminUser>('/admin/users', data),

  updateUser: (id: string, data: Partial<AdminUserDetail> & { profile?: Record<string, unknown> }) =>
    httpClient.patch<AdminUserDetail>(`/admin/users/${id}`, data),

  deleteUser: (id: string) => httpClient.delete<{ message: string }>(`/admin/users/${id}`),
};

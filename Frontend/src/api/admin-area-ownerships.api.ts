import { httpClient } from './http';

export interface AreaOwnershipRow {
  id: string;
  areaId: string;
  userId: string;
  status: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  areaName: string;
  cityName: string;
  countryName: string;
}

export interface PaginatedAreaOwnerships {
  data: AreaOwnershipRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const adminAreaOwnershipsApi = {
  list(params?: { page?: number; pageSize?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return httpClient.get<PaginatedAreaOwnerships>(`/admin/area-ownerships${qs ? `?${qs}` : ''}`);
  },

  updateStatus(id: string, status: 'pending' | 'active' | 'inactive') {
    return httpClient.patch<{ id: string; areaId: string; userId: string; status: string }>(
      `/admin/area-ownerships/${id}/status`,
      { status }
    );
  },
};

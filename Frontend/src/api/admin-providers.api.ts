import { httpClient } from './http';

export interface AdminProviderRow {
    id: string;
    name: string;
    phone: string;
    image: string | null;
    status: string;
    ownerEmail: string;
    ownerName: string;
    areaName: string;
    cityName: string;
    countryName: string;
}

export interface PaginatedAdminProviders {
    data: AdminProviderRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const adminProvidersApi = {
    list(params?: { page?: number; pageSize?: number; status?: string }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
        if (params?.status) searchParams.set('status', params.status);
        const qs = searchParams.toString();
        return httpClient.get<PaginatedAdminProviders>(`/admin/providers${qs ? `?${qs}` : ''}`);
    },

    updateStatus(id: string, status: 'pending' | 'active' | 'inactive') {
        return httpClient.patch<{ id: string; name: string; status: string }>(
            `/admin/providers/${id}/status`,
            { status }
        );
    },
};

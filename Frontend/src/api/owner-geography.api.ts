import { httpClient } from './http';

export interface AreaOwnership {
  id: string;
  areaId: string;
  status: string;
  areaName: string;
  areaStatus: string;
  cityId: string;
  cityName: string;
  countryId: string;
  countryCode: string;
  countryName: string;
}

export interface OwnerProvider {
  id: string;
  name: string;
  areaId: string;
  areaOwnerId: string;
  areaName: string;
  cityName: string;
  countryName: string;
}

export const ownerGeographyApi = {
  getMyAreaOwnerships: () =>
    httpClient.get<{ data: AreaOwnership[] }>('/owner/area-ownerships'),

  requestAreaOwnership: (areaId: string) =>
    httpClient.post<AreaOwnership>('/owner/area-ownerships', { areaId }),

  getMyProviders: () =>
    httpClient.get<{ data: OwnerProvider[] }>('/owner/providers'),

  createProvider: (data: { name: string; areaId: string }) =>
    httpClient.post<OwnerProvider>('/owner/providers', data),

  createBookableItem: (data: {
    providerId: string;
    areaId?: string;
    itemType: 'tour' | 'accommodation' | 'vehicle' | 'ticket';
    title: string;
    attribute?: Record<string, unknown>;
    price?: number;
  }) => httpClient.post<{ id: string; id_provider: string; id_area: string; item_type: string; title: string; price?: number }>('/owner/bookable-items', data),
};

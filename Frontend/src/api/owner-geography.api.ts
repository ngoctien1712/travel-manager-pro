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
  areaName: string;
  cityName: string;
  countryName: string;
  phone?: string;
  image?: string;
  status: string;
}

export const ownerGeographyApi = {
  getMyAreaOwnerships: () =>
    httpClient.get<{ data: AreaOwnership[] }>('/owner/area-ownerships'),

  requestAreaOwnership: (areaId: string) =>
    httpClient.post<AreaOwnership>('/owner/area-ownerships', { areaId }),

  getMyProviders: () =>
    httpClient.get<{ data: OwnerProvider[] }>('/owner/providers'),

  listMyBookableItems: (providerId: string) =>
    httpClient.get<{ data: any[] }>(`/owner/providers/${providerId}/bookable-items`),

  listAllMyBookableItems: () =>
    httpClient.get<{ data: any[] }>('/owner/bookable-items'),

  getServiceDetail: (idItem: string) =>
    httpClient.get<{ data: any }>(`/owner/bookable-items/${idItem}`),

  updateServiceDetail: (idItem: string, data: any) =>
    httpClient.put<{ success: boolean }>(`/owner/bookable-items/${idItem}`, data),

  updateServiceStatus: (idItem: string, status: string) =>
    httpClient.put<{ success: boolean; status: string }>(`/owner/bookable-items/${idItem}/status`, { status }),

  deleteService: (idItem: string) =>
    httpClient.delete<{ success: boolean }>(`/owner/bookable-items/${idItem}`),

  createProvider: (data: FormData) =>
    httpClient.post<OwnerProvider>('/owner/providers', data),

  addItemMedia: (idItem: string, data: FormData) =>
    httpClient.post<{ data: any[] }>(`/owner/bookable-items/${idItem}/media`, data),

  deleteItemMedia: (idMedia: string) =>
    httpClient.delete<{ success: boolean }>(`/owner/media/${idMedia}`),

  addVehiclePosition: (idItem: string, data: { codePosition: string; price: number }) =>
    httpClient.post<{ data: any }>(`/owner/bookable-items/${idItem}/positions`, data),

  deleteVehiclePosition: (idPosition: string) =>
    httpClient.delete<{ success: boolean }>(`/owner/positions/${idPosition}`),

  createBookableItem: (data: {
    providerId: string;
    areaId?: string;
    itemType: 'tour' | 'accommodation' | 'vehicle' | 'ticket';
    title: string;
    attribute?: Record<string, unknown>;
    price?: number;
    extraData?: Record<string, any>;
  }) => httpClient.post<{ id: string; id_provider: string; id_area: string; item_type: string; title: string; price?: number }>('/owner/bookable-items', data),

  addAccommodationRoom: (idItem: string, data: { nameRoom: string; maxGuest: number; attribute?: any; price: number }) =>
    httpClient.post(`/owner/bookable-items/${idItem}/rooms`, data),

  updateAccommodationRoom: (idRoom: string, data: { nameRoom: string; maxGuest: number; attribute?: any; price: number }) =>
    httpClient.put(`/owner/rooms/${idRoom}`, data),

  deleteAccommodationRoom: (idRoom: string) =>
    httpClient.delete(`/owner/rooms/${idRoom}`),

  updateVehiclePosition: (idPosition: string, data: { codePosition: string; price: number }) =>
    httpClient.put(`/owner/positions/${idPosition}`, data),

  manageVehicle: (idItem: string, data: { codeVehicle: string; maxGuest: number; attribute?: any }) =>
    httpClient.post(`/owner/bookable-items/${idItem}/vehicle`, data),

  addVehicleTrip: (idVehicle: string, data: { departureTime: string; arrivalTime?: string; priceOverride?: number }) =>
    httpClient.post(`/owner/vehicle/${idVehicle}/trips`, data),

  deleteVehicleTrip: (idTrip: string) =>
    httpClient.delete(`/owner/trips/${idTrip}`),
};

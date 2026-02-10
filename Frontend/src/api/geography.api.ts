import { httpClient } from './http';
import type { Country, City, Area, PointOfInterest, AreaAttribute, PoiType } from '@/types/dto';

interface GeographyListResponse<T> {
  data: T[];
}

export const geographyApi = {
  listCountries(): Promise<GeographyListResponse<Country>> {
    return httpClient.get('/geography/countries');
  },
  listCities(countryId: string): Promise<GeographyListResponse<City>> {
    return httpClient.get(`/geography/cities?countryId=${encodeURIComponent(countryId)}`);
  },
  listAreas(cityId: string, status = 'active'): Promise<GeographyListResponse<Area>> {
    return httpClient.get(`/geography/areas?cityId=${encodeURIComponent(cityId)}&status=${status}`);
  },
  listPois(areaId: string): Promise<GeographyListResponse<PointOfInterest>> {
    return httpClient.get(`/geography/pois?areaId=${encodeURIComponent(areaId)}`);
  },
};

interface AdminCountryBody {
  code: string;
  name?: string;
  nameVi?: string;
}

interface AdminCityBody {
  countryId: string;
  name: string;
  nameVi?: string;
  latitude?: number;
  longitude?: number;
}

interface AdminAreaBody {
  cityId: string;
  name: string;
  attribute?: AreaAttribute | null;
  status?: string;
}

interface AdminPoiBody {
  areaId: string;
  name: string;
  poiType?: PoiType | null;
}

export const adminGeographyApi = {
  createCountry(body: AdminCountryBody) {
    return httpClient.post<Country>('/admin/geography/countries', body);
  },
  updateCountry(id: string, body: Partial<AdminCountryBody>) {
    return httpClient.patch<Country>(`/admin/geography/countries/${id}`, body);
  },
  deleteCountry(id: string) {
    return httpClient.delete(`/admin/geography/countries/${id}`);
  },

  createCity(body: AdminCityBody) {
    return httpClient.post<City>('/admin/geography/cities', body);
  },
  updateCity(id: string, body: Partial<AdminCityBody>) {
    return httpClient.patch<City>(`/admin/geography/cities/${id}`, body);
  },
  deleteCity(id: string) {
    return httpClient.delete(`/admin/geography/cities/${id}`);
  },

  createArea(body: AdminAreaBody) {
    return httpClient.post<Area>('/admin/geography/areas', body);
  },
  updateArea(id: string, body: Partial<AdminAreaBody>) {
    return httpClient.patch<Area>(`/admin/geography/areas/${id}`, body);
  },
  deleteArea(id: string) {
    return httpClient.delete(`/admin/geography/areas/${id}`);
  },

  createPoi(body: AdminPoiBody) {
    return httpClient.post<PointOfInterest>('/admin/geography/pois', body);
  },
  updatePoi(id: string, body: Partial<AdminPoiBody>) {
    return httpClient.patch<PointOfInterest>(`/admin/geography/pois/${id}`, body);
  },
  deletePoi(id: string) {
    return httpClient.delete(`/admin/geography/pois/${id}`);
  },
};

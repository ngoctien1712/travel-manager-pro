// Customer API - real calls to backend customer routes

import { httpClient } from './http';
import { userApi } from './user.api';
import type {
  Cart,
  CartItem,
  HomePageData,
  ListParams,
  TripPlanInput,
} from '@/types/dto';

interface ServiceListParams {
  q?: string;
  type?: string;
  city?: string;
  provinceId?: string;
  districtId?: string;
  wardId?: string;
  arrivalProvinceId?: string; // For vehicle routes
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  departureDate?: string;
  returnDate?: string;
  guestCount?: number | string;
}

interface OrderListParams extends ListParams {
  status?: string;
}

interface BackendHomeData {
  categories: { id: string; name: string; icon: string; count: number }[];
  topTours: any[];
  topAccommodations: any[];
  topVehicles: any[];
  topTickets: any[];
  popularDestinations: {
    id: string;
    name: string;
    serviceCount: number;
    image: string;
  }[];
}

export const customerApi = {
  // ---- Home page ----
  async getHome(): Promise<HomePageData> {
    const data = await httpClient.get<BackendHomeData>('/customer/home');

    const mapBackendServiceToService = (s: any): any => ({
      id: s.id,
      providerId: '',
      providerName: '',
      name: s.name,
      slug: s.id,
      type: s.type,
      description: '',
      shortDescription: '',
      images: [],
      thumbnail: s.thumbnail,
      location: s.city,
      city: s.city,
      address: '',
      duration: undefined,
      price: s.price,
      originalPrice: undefined,
      currency: 'VND',
      rating: s.rating,
      reviewCount: 0,
      maxGuests: undefined,
      amenities: [],
      highlights: [],
      inclusions: [],
      exclusions: [],
      cancellationPolicy: '',
      status: 'published',
      featured: true,
      createdAt: '',
      updatedAt: '',
    });

    return {
      heroBanners: [],
      categories: data.categories,
      featuredServices: [], // No longer used as primary
      topTours: data.topTours?.map(mapBackendServiceToService) || [],
      topAccommodations: data.topAccommodations?.map(mapBackendServiceToService) || [],
      topVehicles: data.topVehicles?.map(mapBackendServiceToService) || [],
      topTickets: data.topTickets?.map(mapBackendServiceToService) || [],
      topRatedServices: [],
      featuredVouchers: [],
      popularDestinations: data.popularDestinations.map((d) => ({
        id: d.id,
        name: d.name,
        image: d.image,
        serviceCount: d.serviceCount,
      })),
    };
  },

  // ---- Services ----
  async listServices(params: ServiceListParams = {}): Promise<{ items: any[] }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.type) searchParams.set('type', params.type);
    if (params.city) searchParams.set('city', params.city);
    if (params.provinceId) searchParams.set('provinceId', params.provinceId);
    if (params.districtId) searchParams.set('districtId', params.districtId);
    if (params.wardId) searchParams.set('wardId', params.wardId);
    if (params.arrivalProvinceId) searchParams.set('arrivalProvinceId', params.arrivalProvinceId);
    if (params.minPrice != null) searchParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) searchParams.set('maxPrice', String(params.maxPrice));
    if (params.date) searchParams.set('date', params.date);
    if (params.checkIn) searchParams.set('checkIn', params.checkIn);
    if (params.checkOut) searchParams.set('checkOut', params.checkOut);
    if (params.departureDate) searchParams.set('departureDate', params.departureDate);
    if (params.returnDate) searchParams.set('returnDate', params.returnDate);
    if (params.guestCount) searchParams.set('guestCount', String(params.guestCount));

    const query = searchParams.toString();
    const items = await httpClient.get<any[]>(`/customer/services${query ? `?${query}` : ''}`);
    // Services page đang dùng result.items chứa raw record từ DB
    return { items };
  },

  async getServiceDetail(id: string): Promise<any> {
    return httpClient.get<any>(`/customer/services/${id}`);
  },

  // ---- Booking ----
  async createBooking(payload: {
    id_item: string;
    item_type: string;
    payment_method: string;
    details: any;
  }): Promise<{ success: boolean; id_order: string; order_code: string; total_amount: number }> {
    return httpClient.post('/customer/bookings', payload);
  },

  // ---- Orders & Payments ----
  async createOrder(_payload: {
    travelerInfo: { fullName: string; email: string; phone: string };
    paymentMethod: string;
    notes?: string;
  }): Promise<{ id_order: string; id_pay: string; total: number }> {
    // Backend createOrder hiện chỉ cần payment_method, các info khác có thể mở rộng sau
    const res = await httpClient.post<{ id_order: string; id_pay: string; total: number }>(
      '/customer/orders',
      { payment_method: _payload.paymentMethod },
    );
    return res;
  },

  async listMyOrders(_params: OrderListParams = {}): Promise<{ items: any[] }> {
    const rows = await httpClient.get<any[]>('/customer/orders');
    return { items: rows };
  },

  async getMyOrder(id: string): Promise<any> {
    const res = await httpClient.get<{ order: any; items: any[]; payments: any[] }>(`/customer/orders/${id}`);
    // OrderDetail page mong đợi order.items và order.payments nằm cùng object
    return {
      ...res.order,
      items: res.items,
      payments: res.payments,
    };
  },

  async cancelOrder(id: string): Promise<void> {
    await httpClient.post(`/customer/orders/${id}/cancel`, {});
  },

  async requestRefund(id: string, amount: number, reason: string): Promise<any> {
    return httpClient.post(`/customer/orders/${id}/refund`, { amount, reason });
  },

  async createPayment(id_order: string, method: string): Promise<void> {
    await httpClient.post('/customer/payments', { id_order, method });
  },

  async initMomoPayment(id_order: string): Promise<{ payUrl: string }> {
    return httpClient.post('/customer/payments/momo', { id_order });
  },

  // ---- Trip planner ----
  async createTripPlan(input: {
    destination: string;
    startDate: string;
    endDate: string;
    budget?: number;
  }): Promise<any> {
    const res = await httpClient.post<{
      id_trip_plan: string;
      destination: string;
      startDate: string;
      endDate: string;
      budget?: number;
      days: { dayNumber: number; activities: any[] }[];
    }>('/customer/trip-plans', {
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
    });

    // TripPlanner.tsx dùng trực tiếp các field này
    return res;
  },

  // (Giữ cho tương thích nếu sau này cần DTO chuẩn hơn)
  async generateTripPlan(input: TripPlanInput): Promise<any> {
    return this.createTripPlan({
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
    });
  },

  // ---- Profile (dựa trên userApi hiện có) ----
  async getProfile(): Promise<any> {
    return userApi.getProfile();
  },

  async updateProfile(data: { fullName?: string; phone?: string; travel_style?: string }): Promise<any> {
    const profile: Record<string, unknown> = {};
    if (data.travel_style) profile.travel_style = data.travel_style;

    return userApi.updateProfile({
      fullName: data.fullName,
      phone: data.phone,
      profile,
    });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    await userApi.changePassword(oldPassword, newPassword);
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  },

  // ---- Cart (Mock since backend is missing it) ----
  async getCart(): Promise<any> {
    const saved = localStorage.getItem('travel_cart');
    if (saved) return JSON.parse(saved);

    // Default empty cart with some high-quality mock items if never set
    const initialCart = {
      items: [
        {
          id_cart_item: 'mock-1',
          title: 'Premium Halong Bay Cruise',
          thumbnail: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600',
          price: 2500000,
          quantity: 1
        }
      ],
      subtotal: 2500000,
      discount: 0,
      total: 2500000
    };
    localStorage.setItem('travel_cart', JSON.stringify(initialCart));
    return initialCart;
  },

  async removeCartItem(id: string): Promise<any> {
    const cart = await this.getCart();
    cart.items = cart.items.filter((item: any) => item.id_cart_item !== id);
    cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    cart.total = cart.subtotal - cart.discount;
    localStorage.setItem('travel_cart', JSON.stringify(cart));
    return cart;
  },
};
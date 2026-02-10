 // Data Transfer Objects for the Travel Management System
 
 export type UserRole = 'admin' | 'customer' | 'owner';
 
 export type UserStatus = 'active' | 'inactive' | 'banned';
 
 export interface User {
   id: string;
   email: string;
   fullName: string;
   phone: string;
   avatar?: string;
   role: UserRole;
   status: UserStatus;
   createdAt: string;
   updatedAt: string;
 }
 
 export type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
 
 export interface Provider {
   id: string;
   userId: string;
   businessName: string;
   businessType: string;
   description: string;
   logo?: string;
   coverImage?: string;
   address: string;
   city: string;
   phone: string;
   email: string;
   website?: string;
   taxId?: string;
   bankAccount?: string;
   bankName?: string;
   rating: number;
   reviewCount: number;
   status: ProviderStatus;
   verifiedAt?: string;
   createdAt: string;
   updatedAt: string;
 }
 
 export type ServiceType = 'tour' | 'hotel' | 'ticket' | 'experience';
 
 export type ServiceStatus = 'draft' | 'published' | 'unpublished' | 'archived';
 
 export interface ServiceImage {
   id: string;
   url: string;
   alt: string;
   order: number;
 }
 
 export interface Service {
   id: string;
   providerId: string;
   providerName: string;
   name: string;
   slug: string;
   type: ServiceType;
   description: string;
   shortDescription: string;
   images: ServiceImage[];
   thumbnail: string;
   location: string;
   city: string;
   address: string;
   duration?: string;
   price: number;
   originalPrice?: number;
   currency: string;
   rating: number;
   reviewCount: number;
   maxGuests?: number;
   amenities: string[];
   highlights: string[];
   inclusions: string[];
   exclusions: string[];
   cancellationPolicy: string;
   status: ServiceStatus;
   featured: boolean;
   createdAt: string;
   updatedAt: string;
 }
 
 export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';
 
 export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
 
 export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'momo' | 'zalopay' | 'cash';
 
 export interface OrderItem {
   id: string;
   serviceId: string;
   serviceName: string;
   serviceThumbnail: string;
   quantity: number;
   unitPrice: number;
   subtotal: number;
   travelDate: string;
   guestCount: number;
 }
 
 export interface TravelerInfo {
   fullName: string;
   email: string;
   phone: string;
   specialRequests?: string;
 }
 
 export interface Order {
   id: string;
   orderNumber: string;
   customerId: string;
   customerName: string;
   customerEmail: string;
   customerPhone: string;
   providerId: string;
   providerName: string;
   items: OrderItem[];
   subtotal: number;
   discount: number;
   voucherCode?: string;
   total: number;
   currency: string;
   status: OrderStatus;
   paymentStatus: PaymentStatus;
   paymentMethod: PaymentMethod;
   travelerInfo: TravelerInfo;
   notes?: string;
   createdAt: string;
   updatedAt: string;
 }
 
 export type VoucherType = 'percentage' | 'fixed';
 
 export type VoucherStatus = 'active' | 'expired' | 'depleted' | 'disabled';
 
 export interface Voucher {
   id: string;
   code: string;
   name: string;
   description: string;
   discountType: VoucherType;
   discountValue: number;
   minOrderValue: number;
   maxDiscount?: number;
   quantity: number;
   usedCount: number;
   startDate: string;
   endDate: string;
   applicableServices?: string[];
   status: VoucherStatus;
   createdAt: string;
   updatedAt: string;
 }
 
 export interface Review {
   id: string;
   serviceId: string;
   serviceName: string;
   customerId: string;
   customerName: string;
   customerAvatar?: string;
   rating: number;
   title: string;
   content: string;
   images?: string[];
   helpful: number;
   verified: boolean;
   createdAt: string;
 }
 
 export interface CartItem {
   id: string;
   serviceId: string;
   serviceName: string;
   serviceThumbnail: string;
   serviceType: ServiceType;
   price: number;
   quantity: number;
   travelDate: string;
   guestCount: number;
 }
 
 export interface Cart {
   items: CartItem[];
   subtotal: number;
   discount: number;
   voucherCode?: string;
   total: number;
 }
 
 export interface TripPlanInput {
   destination: string;
   startDate: string;
   endDate: string;
   budget: number;
   travelers: number;
   interests: string[];
 }
 
 export interface TripActivity {
   time: string;
   title: string;
   description: string;
   serviceId?: string;
   type: 'activity' | 'meal' | 'transport' | 'accommodation';
 }
 
 export interface TripDay {
   date: string;
   dayNumber: number;
   activities: TripActivity[];
 }
 
 export interface TripPlan {
   id: string;
   destination: string;
   startDate: string;
   endDate: string;
   days: TripDay[];
   suggestedServices: Service[];
   estimatedBudget: number;
 }
 
 export interface Media {
   id: string;
   providerId: string;
   url: string;
   type: 'image' | 'video';
   name: string;
   size: number;
   mimeType: string;
   alt?: string;
   attachedToServices: string[];
   createdAt: string;
 }
 
 // API Response Types
 export interface PaginatedResponse<T> {
   data: T[];
   total: number;
   page: number;
   pageSize: number;
   totalPages: number;
 }
 
 export interface ListParams {
   page?: number;
   pageSize?: number;
   search?: string;
   sortBy?: string;
   sortOrder?: 'asc' | 'desc';
 }
 
 export interface DashboardStats {
   totalOrders: number;
   totalRevenue: number;
   totalCustomers: number;
   totalServices: number;
   ordersChange: number;
   revenueChange: number;
   recentOrders: Order[];
   revenueChart: { date: string; revenue: number }[];
   ordersByStatus: { status: string; count: number }[];
 }
 
 export interface OwnerDashboardStats {
   totalOrders: number;
   totalRevenue: number;
   averageRating: number;
   totalServices: number;
   ordersChange: number;
   revenueChange: number;
   recentOrders: Order[];
   revenueChart: { date: string; revenue: number }[];
 }
 
export interface HomePageData {
  heroBanners: { id: string; image: string; title: string; subtitle: string; link: string }[];
  categories: { id: string; name: string; icon: string; count: number }[];
  featuredServices: Service[];
  topRatedServices: Service[];
  featuredVouchers: Voucher[];
  popularDestinations: { id: string; name: string; image: string; serviceCount: number }[];
}

// ============ Geography (Area.attribute, POI.poi_type) ============

export interface AreaAttributeTemperature {
  min: number;
  max: number;
  unit: 'celsius' | 'fahrenheit';
}

export interface AreaAttributeRainySeason {
  from_month: number;
  to_month: number;
}

export interface AreaAttributeKeyFeature {
  name: string;
  details: string;
}

export interface AreaAttributeLocalRegulations {
  noise_restriction_hours?: string;
  building_height_limit_m?: number;
  [key: string]: unknown;
}

export interface AreaAttribute {
  climate_type?: string;
  average_temperature?: AreaAttributeTemperature;
  rainy_season?: AreaAttributeRainySeason;
  best_travel_months?: number[];
  weather_notes?: string[];
  local_regulations?: AreaAttributeLocalRegulations;
  key_features?: AreaAttributeKeyFeature[];
}

export type PoiCategory = 'food' | 'attraction' | 'cafe' | 'entertainment';
export type PoiSubType = 'restaurant' | 'street_food' | 'beach' | 'museum' | 'bar' | string;

export interface PoiTypeRating {
  score: number;
  reviews_count: number;
}

export interface PoiTypePriceRange {
  level?: string;
  min?: number;
  max?: number;
  currency?: string;
}

export interface PoiTypeRecommendedTime {
  time_of_day?: string[];
  avg_duration_minutes?: number;
}

export interface PoiTypeCrowdLevel {
  weekday?: string;
  weekend?: string;
}

export interface PoiTypeSuitability {
  solo?: boolean;
  couple?: boolean;
  family?: boolean;
  group?: boolean;
}

export interface PoiType {
  poi_category?: PoiCategory;
  poi_sub_type?: PoiSubType;
  rating?: PoiTypeRating;
  price_range?: PoiTypePriceRange;
  activities?: string[];
  recommended_time?: PoiTypeRecommendedTime;
  crowd_level?: PoiTypeCrowdLevel;
  suitability?: PoiTypeSuitability;
  tags?: string[];
  operating_hours?: Record<string, string>;
  accessibility?: { wheelchair_accessible?: boolean; braille_signs?: boolean; [key: string]: unknown };
  contact_info?: { phone?: string; website?: string };
}

export interface Country {
  id: string;
  code: string;
  name: string | null;
  nameVi: string | null;
}

export interface City {
  id: string;
  countryId: string;
  name: string;
  nameVi: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Area {
  id: string;
  cityId: string;
  name: string;
  attribute: AreaAttribute | null;
  status: string;
}

export interface PointOfInterest {
  id: string;
  areaId: string;
  name: string;
  poiType: PoiType | null;
}
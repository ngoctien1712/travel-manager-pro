 // Owner (Area Owner / Service Provider) API
 
 import { delay, paginate, filterBySearch, sortBy } from './http';
 import {
   mockServices,
   mockOrders,
   mockOwnerDashboard,
   mockProviders,
 } from '@/mocks/data';
 import { generateMedia } from '@/mocks/data';
 import type {
   Service,
   Order,
   Media,
   Provider,
   OwnerDashboardStats,
   PaginatedResponse,
   ListParams,
 } from '@/types/dto';
 
 // Simulated current owner (first provider)
 const CURRENT_OWNER_ID = 'provider-1';
 
 // Generate media for current owner
 let ownerMedia = generateMedia(20, CURRENT_OWNER_ID);
 
 interface ServiceListParams extends ListParams {
   status?: string;
 }
 
 interface OrderListParams extends ListParams {
   status?: string;
 }
 
 export const ownerApi = {
   // Dashboard
   async getDashboard(): Promise<OwnerDashboardStats> {
     await delay();
     return mockOwnerDashboard;
   },
 
   // My Services
   async listMyServices(params: ServiceListParams = {}): Promise<PaginatedResponse<Service>> {
     await delay();
     let filtered = mockServices.filter(s => s.providerId === CURRENT_OWNER_ID);
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['name', 'city', 'location']);
     }
     if (params.status) {
       filtered = filtered.filter(s => s.status === params.status);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Service, params.sortOrder);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getMyService(id: string): Promise<Service | undefined> {
     await delay();
     return mockServices.find(s => s.id === id && s.providerId === CURRENT_OWNER_ID);
   },
 
   async createMyService(data: Partial<Service>): Promise<Service> {
     await delay();
     const owner = mockProviders.find(p => p.id === CURRENT_OWNER_ID);
     const newService: Service = {
       id: `service-${Date.now()}`,
       providerId: CURRENT_OWNER_ID,
       providerName: owner?.businessName || 'My Business',
       name: data.name || '',
       slug: (data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
       type: data.type || 'tour',
       description: data.description || '',
       shortDescription: data.shortDescription || '',
       images: data.images || [],
       thumbnail: data.thumbnail || '',
       location: data.location || '',
       city: data.city || '',
       address: data.address || '',
       price: data.price || 0,
       currency: 'VND',
       rating: 0,
       reviewCount: 0,
       amenities: data.amenities || [],
       highlights: data.highlights || [],
       inclusions: data.inclusions || [],
       exclusions: data.exclusions || [],
       cancellationPolicy: data.cancellationPolicy || '',
       status: 'draft',
       featured: false,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
     mockServices.push(newService);
     return newService;
   },
 
   async updateMyService(id: string, data: Partial<Service>): Promise<Service> {
     await delay();
     const index = mockServices.findIndex(s => s.id === id && s.providerId === CURRENT_OWNER_ID);
     if (index === -1) throw new Error('Service not found');
     mockServices[index] = { ...mockServices[index], ...data, updatedAt: new Date().toISOString() };
     return mockServices[index];
   },
 
   async deleteMyService(id: string): Promise<void> {
     await delay();
     const index = mockServices.findIndex(s => s.id === id && s.providerId === CURRENT_OWNER_ID);
     if (index !== -1) mockServices.splice(index, 1);
   },
 
   async togglePublish(id: string): Promise<Service> {
     await delay();
     const index = mockServices.findIndex(s => s.id === id && s.providerId === CURRENT_OWNER_ID);
     if (index === -1) throw new Error('Service not found');
     
     const currentStatus = mockServices[index].status;
     mockServices[index].status = currentStatus === 'published' ? 'unpublished' : 'published';
     mockServices[index].updatedAt = new Date().toISOString();
     
     return mockServices[index];
   },
 
   // Media Management
   async listMedia(params: ListParams = {}): Promise<PaginatedResponse<Media>> {
     await delay();
     let filtered = [...ownerMedia];
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['name', 'alt']);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Media, params.sortOrder);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async uploadMedia(file: { name: string; size: number; type: string }): Promise<Media> {
     await delay(600);
     const newMedia: Media = {
       id: `media-${Date.now()}`,
       providerId: CURRENT_OWNER_ID,
       url: `https://images.unsplash.com/photo-${Date.now()}?w=800`,
       type: file.type.startsWith('video') ? 'video' : 'image',
       name: file.name,
       size: file.size,
       mimeType: file.type,
       attachedToServices: [],
       createdAt: new Date().toISOString(),
     };
     ownerMedia.unshift(newMedia);
     return newMedia;
   },
 
   async deleteMedia(id: string): Promise<void> {
     await delay();
     ownerMedia = ownerMedia.filter(m => m.id !== id);
   },
 
   async attachMediaToService(mediaId: string, serviceId: string): Promise<Media> {
     await delay();
     const index = ownerMedia.findIndex(m => m.id === mediaId);
     if (index === -1) throw new Error('Media not found');
     
     if (!ownerMedia[index].attachedToServices.includes(serviceId)) {
       ownerMedia[index].attachedToServices.push(serviceId);
     }
     return ownerMedia[index];
   },
 
   // Orders
   async listOrders(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
     await delay();
     let filtered = mockOrders.filter(o => o.providerId === CURRENT_OWNER_ID);
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['orderNumber', 'customerName']);
     }
     if (params.status) {
       filtered = filtered.filter(o => o.status === params.status);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Order, params.sortOrder);
     } else {
       filtered = sortBy(filtered, 'createdAt', 'desc');
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getOrder(id: string): Promise<Order | undefined> {
     await delay();
     return mockOrders.find(o => o.id === id && o.providerId === CURRENT_OWNER_ID);
   },
 
   async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
     await delay();
     const index = mockOrders.findIndex(o => o.id === id && o.providerId === CURRENT_OWNER_ID);
     if (index === -1) throw new Error('Order not found');
     mockOrders[index] = { ...mockOrders[index], status, updatedAt: new Date().toISOString() };
     return mockOrders[index];
   },
 
   // Profile
   async getProfile(): Promise<Provider> {
     await delay();
     const provider = mockProviders.find(p => p.id === CURRENT_OWNER_ID);
     if (!provider) throw new Error('Provider not found');
     return provider;
   },
 
   async updateProfile(data: Partial<Provider>): Promise<Provider> {
     await delay();
     const index = mockProviders.findIndex(p => p.id === CURRENT_OWNER_ID);
     if (index === -1) throw new Error('Provider not found');
     mockProviders[index] = { ...mockProviders[index], ...data, updatedAt: new Date().toISOString() };
     return mockProviders[index];
   },
 };
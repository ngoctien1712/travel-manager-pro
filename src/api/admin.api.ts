 // Admin API - Replace mock implementations with real API calls
 
 import { delay, paginate, filterBySearch, sortBy } from './http';
 import {
   mockUsers,
   mockProviders,
   mockServices,
   mockOrders,
   mockVouchers,
   mockAdminDashboard,
 } from '@/mocks/data';
 import type {
   User,
   Provider,
   Service,
   Order,
   Voucher,
   DashboardStats,
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
   city?: string;
 }
 
 interface ServiceListParams extends ListParams {
   type?: string;
   status?: string;
   city?: string;
   minPrice?: number;
   maxPrice?: number;
   minRating?: number;
 }
 
 interface OrderListParams extends ListParams {
   status?: string;
   paymentStatus?: string;
   paymentMethod?: string;
   providerId?: string;
   startDate?: string;
   endDate?: string;
 }
 
 interface VoucherListParams extends ListParams {
   status?: string;
   startDate?: string;
   endDate?: string;
 }
 
 export const adminApi = {
   // Dashboard
   async getDashboardStats(): Promise<DashboardStats> {
     await delay();
     return mockAdminDashboard;
   },
 
   // Users
   async listUsers(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
     await delay();
     let filtered = [...mockUsers];
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['fullName', 'email', 'phone']);
     }
     if (params.role) {
       filtered = filtered.filter(u => u.role === params.role);
     }
     if (params.status) {
       filtered = filtered.filter(u => u.status === params.status);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof User, params.sortOrder);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getUser(id: string): Promise<User | undefined> {
     await delay();
     return mockUsers.find(u => u.id === id);
   },
 
   async createUser(data: Partial<User>): Promise<User> {
     await delay();
     const newUser: User = {
       id: `user-${Date.now()}`,
       email: data.email || '',
       fullName: data.fullName || '',
       phone: data.phone || '',
       role: data.role || 'customer',
       status: data.status || 'active',
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
     mockUsers.push(newUser);
     return newUser;
   },
 
   async updateUser(id: string, data: Partial<User>): Promise<User> {
     await delay();
     const index = mockUsers.findIndex(u => u.id === id);
     if (index === -1) throw new Error('User not found');
     mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
     return mockUsers[index];
   },
 
   async deleteUser(id: string): Promise<void> {
     await delay();
     const index = mockUsers.findIndex(u => u.id === id);
     if (index !== -1) mockUsers.splice(index, 1);
   },
 
   // Providers
   async listProviders(params: ProviderListParams = {}): Promise<PaginatedResponse<Provider>> {
     await delay();
     let filtered = [...mockProviders];
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['businessName', 'email', 'phone', 'city']);
     }
     if (params.status) {
       filtered = filtered.filter(p => p.status === params.status);
     }
     if (params.city) {
       filtered = filtered.filter(p => p.city === params.city);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Provider, params.sortOrder);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getProvider(id: string): Promise<Provider | undefined> {
     await delay();
     return mockProviders.find(p => p.id === id);
   },
 
   async createProvider(data: Partial<Provider>): Promise<Provider> {
     await delay();
     const newProvider: Provider = {
       id: `provider-${Date.now()}`,
       userId: data.userId || '',
       businessName: data.businessName || '',
       businessType: data.businessType || '',
       description: data.description || '',
       address: data.address || '',
       city: data.city || '',
       phone: data.phone || '',
       email: data.email || '',
       rating: 0,
       reviewCount: 0,
       status: 'pending',
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
     mockProviders.push(newProvider);
     return newProvider;
   },
 
   async updateProvider(id: string, data: Partial<Provider>): Promise<Provider> {
     await delay();
     const index = mockProviders.findIndex(p => p.id === id);
     if (index === -1) throw new Error('Provider not found');
     mockProviders[index] = { ...mockProviders[index], ...data, updatedAt: new Date().toISOString() };
     return mockProviders[index];
   },
 
   async deleteProvider(id: string): Promise<void> {
     await delay();
     const index = mockProviders.findIndex(p => p.id === id);
     if (index !== -1) mockProviders.splice(index, 1);
   },
 
   // Services
   async listServices(params: ServiceListParams = {}): Promise<PaginatedResponse<Service>> {
     await delay();
     let filtered = [...mockServices];
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['name', 'providerName', 'city', 'location']);
     }
     if (params.type) {
       filtered = filtered.filter(s => s.type === params.type);
     }
     if (params.status) {
       filtered = filtered.filter(s => s.status === params.status);
     }
     if (params.city) {
       filtered = filtered.filter(s => s.city === params.city);
     }
     if (params.minPrice !== undefined) {
       filtered = filtered.filter(s => s.price >= params.minPrice!);
     }
     if (params.maxPrice !== undefined) {
       filtered = filtered.filter(s => s.price <= params.maxPrice!);
     }
     if (params.minRating !== undefined) {
       filtered = filtered.filter(s => s.rating >= params.minRating!);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Service, params.sortOrder);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getService(id: string): Promise<Service | undefined> {
     await delay();
     return mockServices.find(s => s.id === id);
   },
 
   async createService(data: Partial<Service>): Promise<Service> {
     await delay();
     const newService: Service = {
       id: `service-${Date.now()}`,
       providerId: data.providerId || '',
       providerName: data.providerName || '',
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
 
   async updateService(id: string, data: Partial<Service>): Promise<Service> {
     await delay();
     const index = mockServices.findIndex(s => s.id === id);
     if (index === -1) throw new Error('Service not found');
     mockServices[index] = { ...mockServices[index], ...data, updatedAt: new Date().toISOString() };
     return mockServices[index];
   },
 
   async deleteService(id: string): Promise<void> {
     await delay();
     const index = mockServices.findIndex(s => s.id === id);
     if (index !== -1) mockServices.splice(index, 1);
   },
 
   // Orders
   async listOrders(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
     await delay();
     let filtered = [...mockOrders];
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['orderNumber', 'customerName', 'customerEmail']);
     }
     if (params.status) {
       filtered = filtered.filter(o => o.status === params.status);
     }
     if (params.paymentStatus) {
       filtered = filtered.filter(o => o.paymentStatus === params.paymentStatus);
     }
     if (params.paymentMethod) {
       filtered = filtered.filter(o => o.paymentMethod === params.paymentMethod);
     }
     if (params.providerId) {
       filtered = filtered.filter(o => o.providerId === params.providerId);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Order, params.sortOrder);
     } else {
       // Default sort by newest first
       filtered = sortBy(filtered, 'createdAt', 'desc');
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getOrder(id: string): Promise<Order | undefined> {
     await delay();
     return mockOrders.find(o => o.id === id);
   },
 
   async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
     await delay();
     const index = mockOrders.findIndex(o => o.id === id);
     if (index === -1) throw new Error('Order not found');
     mockOrders[index] = { ...mockOrders[index], status, updatedAt: new Date().toISOString() };
     return mockOrders[index];
   },
 
   async deleteOrder(id: string): Promise<void> {
     await delay();
     const index = mockOrders.findIndex(o => o.id === id);
     if (index !== -1) mockOrders.splice(index, 1);
   },
 
   // Vouchers
   async listVouchers(params: VoucherListParams = {}): Promise<PaginatedResponse<Voucher>> {
     await delay();
     let filtered = [...mockVouchers];
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['code', 'name', 'description']);
     }
     if (params.status) {
       filtered = filtered.filter(v => v.status === params.status);
     }
     if (params.sortBy) {
       filtered = sortBy(filtered, params.sortBy as keyof Voucher, params.sortOrder);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getVoucher(id: string): Promise<Voucher | undefined> {
     await delay();
     return mockVouchers.find(v => v.id === id);
   },
 
   async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
     await delay();
     const newVoucher: Voucher = {
       id: `voucher-${Date.now()}`,
       code: data.code || '',
       name: data.name || '',
       description: data.description || '',
       discountType: data.discountType || 'percentage',
       discountValue: data.discountValue || 0,
       minOrderValue: data.minOrderValue || 0,
       maxDiscount: data.maxDiscount,
       quantity: data.quantity || 0,
       usedCount: 0,
       startDate: data.startDate || new Date().toISOString(),
       endDate: data.endDate || new Date().toISOString(),
       status: 'active',
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
     mockVouchers.push(newVoucher);
     return newVoucher;
   },
 
   async updateVoucher(id: string, data: Partial<Voucher>): Promise<Voucher> {
     await delay();
     const index = mockVouchers.findIndex(v => v.id === id);
     if (index === -1) throw new Error('Voucher not found');
     mockVouchers[index] = { ...mockVouchers[index], ...data, updatedAt: new Date().toISOString() };
     return mockVouchers[index];
   },
 
   async deleteVoucher(id: string): Promise<void> {
     await delay();
     const index = mockVouchers.findIndex(v => v.id === id);
     if (index !== -1) mockVouchers.splice(index, 1);
   },
 };
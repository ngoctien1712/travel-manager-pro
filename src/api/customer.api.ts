 // Customer API - Replace mock implementations with real API calls
 
 import { delay, paginate, filterBySearch, sortBy } from './http';
 import {
   mockServices,
   mockOrders,
   mockVouchers,
   mockReviews,
   mockCart,
   mockHomePageData,
   mockUsers,
 } from '@/mocks/data';
 import type {
   Service,
   Order,
   Review,
   Cart,
   CartItem,
   TripPlan,
   TripPlanInput,
   HomePageData,
   PaginatedResponse,
   ListParams,
   User,
 } from '@/types/dto';
 
 interface ServiceListParams extends ListParams {
   type?: string;
   city?: string;
   minPrice?: number;
   maxPrice?: number;
   minRating?: number;
 }
 
 interface OrderListParams extends ListParams {
   status?: string;
 }
 
 // Local cart state (simulating client-side cart)
 let cartItems: CartItem[] = [...mockCart];
 let appliedVoucherCode: string | undefined;
 
 export const customerApi = {
   // Home page data
   async getHome(): Promise<HomePageData> {
     await delay();
     return mockHomePageData;
   },
 
   // Services
   async listServices(params: ServiceListParams = {}): Promise<PaginatedResponse<Service>> {
     await delay();
     let filtered = mockServices.filter(s => s.status === 'published');
     
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['name', 'city', 'location', 'shortDescription']);
     }
     if (params.type) {
       filtered = filtered.filter(s => s.type === params.type);
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
 
   async getServiceDetail(id: string): Promise<Service | undefined> {
     await delay();
     return mockServices.find(s => s.id === id);
   },
 
   // Reviews
   async listReviews(serviceId: string, params: ListParams = {}): Promise<PaginatedResponse<Review>> {
     await delay();
     const filtered = mockReviews.filter(r => r.serviceId === serviceId);
     return paginate(filtered, params.page, params.pageSize);
   },
 
   // Cart
   async getCart(): Promise<Cart> {
     await delay(200);
     const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
     let discount = 0;
     
     if (appliedVoucherCode) {
       const voucher = mockVouchers.find(v => v.code === appliedVoucherCode && v.status === 'active');
       if (voucher) {
         if (voucher.discountType === 'percentage') {
           discount = Math.min((subtotal * voucher.discountValue) / 100, voucher.maxDiscount || Infinity);
         } else {
           discount = voucher.discountValue;
         }
       }
     }
     
     return {
       items: cartItems,
       subtotal,
       discount,
       voucherCode: appliedVoucherCode,
       total: subtotal - discount,
     };
   },
 
   async addToCart(item: Omit<CartItem, 'id'>): Promise<Cart> {
     await delay(200);
     const existingIndex = cartItems.findIndex(
       ci => ci.serviceId === item.serviceId && ci.travelDate === item.travelDate
     );
     
     if (existingIndex !== -1) {
       cartItems[existingIndex].quantity += item.quantity;
     } else {
       cartItems.push({
         ...item,
         id: `cart-${Date.now()}`,
       });
     }
     
     return this.getCart();
   },
 
   async updateCartItem(id: string, quantity: number): Promise<Cart> {
     await delay(200);
     const index = cartItems.findIndex(ci => ci.id === id);
     if (index !== -1) {
       if (quantity <= 0) {
         cartItems.splice(index, 1);
       } else {
         cartItems[index].quantity = quantity;
       }
     }
     return this.getCart();
   },
 
   async removeCartItem(id: string): Promise<Cart> {
     await delay(200);
     cartItems = cartItems.filter(ci => ci.id !== id);
     return this.getCart();
   },
 
   async applyVoucher(code: string): Promise<{ success: boolean; message: string; cart: Cart }> {
     await delay();
     const voucher = mockVouchers.find(v => v.code === code && v.status === 'active');
     
     if (!voucher) {
       return {
         success: false,
         message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
         cart: await this.getCart(),
       };
     }
     
     const cart = await this.getCart();
     if (cart.subtotal < voucher.minOrderValue) {
       return {
         success: false,
         message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để sử dụng mã này`,
         cart,
       };
     }
     
     appliedVoucherCode = code;
     return {
       success: true,
       message: 'Áp dụng mã giảm giá thành công!',
       cart: await this.getCart(),
     };
   },
 
   async removeVoucher(): Promise<Cart> {
     await delay(200);
     appliedVoucherCode = undefined;
     return this.getCart();
   },
 
   // Orders
   async createOrder(payload: {
     travelerInfo: Order['travelerInfo'];
     paymentMethod: Order['paymentMethod'];
     notes?: string;
   }): Promise<Order> {
     await delay();
     const cart = await this.getCart();
     const customer = mockUsers.find(u => u.role === 'customer') || mockUsers[0];
     
     const newOrder: Order = {
       id: `order-${Date.now()}`,
       orderNumber: `TRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
       customerId: customer.id,
       customerName: payload.travelerInfo.fullName,
       customerEmail: payload.travelerInfo.email,
       customerPhone: payload.travelerInfo.phone,
       providerId: 'provider-1',
       providerName: 'Mock Provider',
       items: cart.items.map((item, i) => ({
         id: `item-${Date.now()}-${i}`,
         serviceId: item.serviceId,
         serviceName: item.serviceName,
         serviceThumbnail: item.serviceThumbnail,
         quantity: item.quantity,
         unitPrice: item.price,
         subtotal: item.price * item.quantity,
         travelDate: item.travelDate,
         guestCount: item.guestCount,
       })),
       subtotal: cart.subtotal,
       discount: cart.discount,
       voucherCode: cart.voucherCode,
       total: cart.total,
       currency: 'VND',
       status: 'pending',
       paymentStatus: 'pending',
       paymentMethod: payload.paymentMethod,
       travelerInfo: payload.travelerInfo,
       notes: payload.notes,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
     
     mockOrders.unshift(newOrder);
     
     // Clear cart after order
     cartItems = [];
     appliedVoucherCode = undefined;
     
     return newOrder;
   },
 
   async listMyOrders(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
     await delay();
     let filtered = [...mockOrders].sort((a, b) => 
       new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
     );
     
     if (params.status) {
       filtered = filtered.filter(o => o.status === params.status);
     }
     if (params.search) {
       filtered = filterBySearch(filtered, params.search, ['orderNumber']);
     }
     
     return paginate(filtered, params.page, params.pageSize);
   },
 
   async getMyOrder(id: string): Promise<Order | undefined> {
     await delay();
     return mockOrders.find(o => o.id === id);
   },
 
   // Trip Planner
   async generateTripPlan(input: TripPlanInput): Promise<TripPlan> {
     await delay(800);
     const days = Math.ceil(
       (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24)
     ) + 1;
     
     const suggestedServices = mockServices
       .filter(s => s.city === input.destination && s.status === 'published')
       .slice(0, 6);
     
     return {
       id: `trip-${Date.now()}`,
       destination: input.destination,
       startDate: input.startDate,
       endDate: input.endDate,
       days: Array.from({ length: days }, (_, i) => ({
         date: new Date(new Date(input.startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
         dayNumber: i + 1,
         activities: [
           {
             time: '08:00',
             title: 'Ăn sáng',
             description: 'Thưởng thức đặc sản địa phương',
             type: 'meal' as const,
           },
           {
             time: '09:30',
             title: suggestedServices[i % suggestedServices.length]?.name || 'Tham quan',
             description: suggestedServices[i % suggestedServices.length]?.shortDescription || 'Khám phá địa điểm nổi tiếng',
             serviceId: suggestedServices[i % suggestedServices.length]?.id,
             type: 'activity' as const,
           },
           {
             time: '12:00',
             title: 'Ăn trưa',
             description: 'Nghỉ ngơi và thưởng thức ẩm thực',
             type: 'meal' as const,
           },
           {
             time: '14:00',
             title: 'Khám phá thêm',
             description: 'Tự do tham quan hoặc mua sắm',
             type: 'activity' as const,
           },
           {
             time: '19:00',
             title: 'Ăn tối',
             description: 'Trải nghiệm ẩm thực địa phương',
             type: 'meal' as const,
           },
         ],
       })),
       suggestedServices,
       estimatedBudget: input.budget,
     };
   },
 
   // Profile
   async getProfile(): Promise<User> {
     await delay();
     const customer = mockUsers.find(u => u.role === 'customer') || mockUsers[0];
     return customer;
   },
 
   async updateProfile(data: Partial<User>): Promise<User> {
     await delay();
     const index = mockUsers.findIndex(u => u.role === 'customer');
     if (index !== -1) {
       mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
       return mockUsers[index];
     }
     throw new Error('User not found');
   },
 
   async changePassword(_oldPassword: string, _newPassword: string): Promise<{ success: boolean; message: string }> {
     await delay();
     // Mock password change
     return { success: true, message: 'Đổi mật khẩu thành công!' };
   },
 };
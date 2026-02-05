 import type {
   User,
   Provider,
   Service,
   Order,
   Voucher,
   Review,
   Media,
   CartItem,
   DashboardStats,
   OwnerDashboardStats,
   HomePageData,
 } from '@/types/dto';
 
 // Helper to generate random date within range
 const randomDate = (start: Date, end: Date): string => {
   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
 };
 
 // Vietnamese cities and locations
 const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Phú Quốc', 'Đà Lạt', 'Huế', 'Sa Pa', 'Hạ Long'];
 const locations = ['Phố Cổ', 'Biển', 'Núi', 'Thành phố', 'Nông thôn', 'Đảo', 'Khu nghỉ dưỡng'];
 
 // Service thumbnails (placeholder)
 const serviceThumbnails = [
   'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
   'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
   'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
   'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
   'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
   'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
 ];
 
 const avatars = [
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
 ];
 
 // Generate Users
 export const generateUsers = (count: number): User[] => {
   const roles: Array<'admin' | 'customer' | 'owner'> = ['admin', 'customer', 'owner'];
   const statuses: Array<'active' | 'inactive' | 'banned'> = ['active', 'inactive', 'banned'];
   const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
   const lastNames = ['Văn An', 'Thị Bình', 'Minh Châu', 'Đức Dũng', 'Hồng Hạnh', 'Quang Huy', 'Thị Lan', 'Văn Long', 'Thị Mai', 'Anh Tuấn'];
 
   return Array.from({ length: count }, (_, i) => ({
     id: `user-${i + 1}`,
     email: `user${i + 1}@example.com`,
     fullName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
     phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
     avatar: avatars[i % avatars.length],
     role: i === 0 ? 'admin' : roles[Math.floor(Math.random() * roles.length)],
     status: statuses[Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 3)],
     createdAt: randomDate(new Date(2023, 0, 1), new Date()),
     updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
   }));
 };
 
 // Generate Providers
 export const generateProviders = (count: number): Provider[] => {
   const businessTypes = ['Công ty du lịch', 'Khách sạn & Resort', 'Đại lý vé', 'Nhà hàng & Trải nghiệm', 'Hướng dẫn viên'];
   const statuses: Array<'pending' | 'approved' | 'rejected' | 'suspended'> = ['pending', 'approved', 'rejected', 'suspended'];
 
   return Array.from({ length: count }, (_, i) => ({
     id: `provider-${i + 1}`,
     userId: `user-${i + 50}`,
     businessName: `${['Việt', 'Sài Gòn', 'Hà Nội', 'Đà Nẵng', 'Mekong'][i % 5]} ${['Travel', 'Tours', 'Adventures', 'Holidays', 'Explorer'][i % 5]}`,
     businessType: businessTypes[i % businessTypes.length],
     description: 'Chúng tôi cung cấp các dịch vụ du lịch chất lượng cao với nhiều năm kinh nghiệm phục vụ khách hàng trong và ngoài nước.',
     logo: serviceThumbnails[i % serviceThumbnails.length],
     coverImage: serviceThumbnails[(i + 1) % serviceThumbnails.length],
     address: `${Math.floor(Math.random() * 200) + 1} Đường ${['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo', 'Hai Bà Trưng'][i % 4]}`,
     city: cities[i % cities.length],
     phone: `028${Math.floor(10000000 + Math.random() * 90000000)}`,
     email: `contact@provider${i + 1}.vn`,
     website: `https://provider${i + 1}.vn`,
     taxId: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
     bankAccount: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
     bankName: ['Vietcombank', 'BIDV', 'VietinBank', 'Techcombank', 'ACB'][i % 5],
     rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
     reviewCount: Math.floor(Math.random() * 500) + 50,
     status: statuses[Math.floor(Math.random() * 10) < 7 ? 1 : Math.floor(Math.random() * 4)],
     verifiedAt: randomDate(new Date(2023, 0, 1), new Date()),
     createdAt: randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31)),
     updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
   }));
 };
 
 // Generate Services
 export const generateServices = (count: number, providers: Provider[]): Service[] => {
   const types: Array<'tour' | 'hotel' | 'ticket' | 'experience'> = ['tour', 'hotel', 'ticket', 'experience'];
   const statuses: Array<'draft' | 'published' | 'unpublished' | 'archived'> = ['draft', 'published', 'unpublished', 'archived'];
   
   const tourNames = ['Khám phá', 'Hành trình', 'Trải nghiệm', 'Du ngoạn', 'Phiêu lưu'];
   const hotelNames = ['Resort & Spa', 'Boutique Hotel', 'Villa', 'Homestay', 'Beach Resort'];
   const ticketNames = ['Vé tham quan', 'Vé combo', 'Pass trọn ngày', 'Vé VIP', 'Vé gia đình'];
   const experienceNames = ['Lớp nấu ăn', 'Tour ẩm thực', 'Workshop thủ công', 'Đạp xe khám phá', 'Kayak'];
 
   const amenities = ['Wifi miễn phí', 'Bữa sáng', 'Đưa đón sân bay', 'Hồ bơi', 'Spa', 'Phòng gym', 'Nhà hàng', 'Bar'];
   const highlights = ['View đẹp', 'Gần trung tâm', 'Nhân viên thân thiện', 'Sạch sẽ', 'Yên tĩnh', 'An ninh tốt'];
 
   return Array.from({ length: count }, (_, i) => {
     const type = types[i % types.length];
     const provider = providers[i % providers.length];
     const city = cities[i % cities.length];
     const basePrice = type === 'hotel' ? 500000 + Math.random() * 5000000 : 
                       type === 'tour' ? 1000000 + Math.random() * 10000000 :
                       type === 'ticket' ? 100000 + Math.random() * 500000 :
                       300000 + Math.random() * 2000000;
     
     const names = type === 'tour' ? tourNames : type === 'hotel' ? hotelNames : type === 'ticket' ? ticketNames : experienceNames;
     const name = `${names[i % names.length]} ${city}`;
 
     return {
       id: `service-${i + 1}`,
       providerId: provider.id,
       providerName: provider.businessName,
       name,
       slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
       type,
       description: `Trải nghiệm tuyệt vời tại ${city}. Dịch vụ chất lượng cao với nhiều tiện ích hấp dẫn. Phù hợp cho gia đình, cặp đôi và nhóm bạn. Đặt ngay để nhận ưu đãi đặc biệt!`,
       shortDescription: `Dịch vụ ${type === 'tour' ? 'tour du lịch' : type === 'hotel' ? 'lưu trú' : type === 'ticket' ? 'vé tham quan' : 'trải nghiệm'} chất lượng tại ${city}`,
       images: [
         { id: `img-${i}-1`, url: serviceThumbnails[i % serviceThumbnails.length], alt: name, order: 1 },
         { id: `img-${i}-2`, url: serviceThumbnails[(i + 1) % serviceThumbnails.length], alt: name, order: 2 },
         { id: `img-${i}-3`, url: serviceThumbnails[(i + 2) % serviceThumbnails.length], alt: name, order: 3 },
       ],
       thumbnail: serviceThumbnails[i % serviceThumbnails.length],
       location: locations[i % locations.length],
       city,
       address: `${Math.floor(Math.random() * 200) + 1} Đường ${['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo'][i % 3]}, ${city}`,
       duration: type === 'tour' ? `${Math.floor(Math.random() * 5) + 1} ngày ${Math.floor(Math.random() * 4)} đêm` : 
                 type === 'experience' ? `${Math.floor(Math.random() * 4) + 2} giờ` : undefined,
       price: Math.round(basePrice / 1000) * 1000,
       originalPrice: Math.random() > 0.5 ? Math.round((basePrice * 1.2) / 1000) * 1000 : undefined,
       currency: 'VND',
       rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
       reviewCount: Math.floor(Math.random() * 300) + 10,
       maxGuests: type === 'tour' ? 15 + Math.floor(Math.random() * 20) : type === 'hotel' ? 4 : undefined,
       amenities: amenities.slice(0, 3 + Math.floor(Math.random() * 5)),
       highlights: highlights.slice(0, 2 + Math.floor(Math.random() * 4)),
       inclusions: ['Hướng dẫn viên', 'Bảo hiểm du lịch', 'Nước uống', 'Vé tham quan'],
       exclusions: ['Chi phí cá nhân', 'Tip', 'Đồ uống có cồn'],
       cancellationPolicy: 'Hủy miễn phí trước 24 giờ. Sau đó sẽ bị tính 50% phí.',
       status: statuses[Math.floor(Math.random() * 10) < 7 ? 1 : Math.floor(Math.random() * 4)],
       featured: Math.random() > 0.8,
       createdAt: randomDate(new Date(2023, 0, 1), new Date()),
       updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
     };
   });
 };
 
 // Generate Orders
 export const generateOrders = (count: number, services: Service[], users: User[]): Order[] => {
   const statuses: Array<'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded'> = 
     ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'];
   const paymentStatuses: Array<'pending' | 'paid' | 'failed' | 'refunded'> = ['pending', 'paid', 'failed', 'refunded'];
   const paymentMethods: Array<'credit_card' | 'bank_transfer' | 'momo' | 'zalopay' | 'cash'> = 
     ['credit_card', 'bank_transfer', 'momo', 'zalopay', 'cash'];
 
   const customers = users.filter(u => u.role === 'customer');
 
   return Array.from({ length: count }, (_, i) => {
     const service = services[i % services.length];
     const customer = customers[i % customers.length] || users[0];
     const quantity = 1 + Math.floor(Math.random() * 3);
     const subtotal = service.price * quantity;
     const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0;
     const status = statuses[Math.floor(Math.random() * statuses.length)];
     
     return {
       id: `order-${i + 1}`,
       orderNumber: `TRV-${Date.now().toString(36).toUpperCase().slice(-6)}-${(i + 1).toString().padStart(4, '0')}`,
       customerId: customer.id,
       customerName: customer.fullName,
       customerEmail: customer.email,
       customerPhone: customer.phone,
       providerId: service.providerId,
       providerName: service.providerName,
       items: [{
         id: `item-${i}-1`,
         serviceId: service.id,
         serviceName: service.name,
         serviceThumbnail: service.thumbnail,
         quantity,
         unitPrice: service.price,
         subtotal,
         travelDate: randomDate(new Date(), new Date(2025, 11, 31)),
         guestCount: 1 + Math.floor(Math.random() * 4),
       }],
       subtotal,
       discount,
       voucherCode: discount > 0 ? `DISCOUNT${Math.floor(Math.random() * 100)}` : undefined,
       total: subtotal - discount,
       currency: 'VND',
       status,
       paymentStatus: status === 'cancelled' ? 'failed' : status === 'completed' ? 'paid' : paymentStatuses[Math.floor(Math.random() * 2)],
       paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
       travelerInfo: {
         fullName: customer.fullName,
         email: customer.email,
         phone: customer.phone,
         specialRequests: Math.random() > 0.7 ? 'Cần phòng view biển, check-in sớm' : undefined,
       },
       notes: Math.random() > 0.8 ? 'Khách hàng VIP, cần chăm sóc đặc biệt' : undefined,
       createdAt: randomDate(new Date(2024, 0, 1), new Date()),
       updatedAt: randomDate(new Date(2024, 6, 1), new Date()),
     };
   });
 };
 
 // Generate Vouchers
 export const generateVouchers = (count: number): Voucher[] => {
   const statuses: Array<'active' | 'expired' | 'depleted' | 'disabled'> = ['active', 'expired', 'depleted', 'disabled'];
   const names = ['Giảm giá mùa hè', 'Ưu đãi thành viên mới', 'Flash Sale', 'Khuyến mãi cuối tuần', 'Combo tiết kiệm'];
 
   return Array.from({ length: count }, (_, i) => {
     const discountType = Math.random() > 0.5 ? 'percentage' : 'fixed' as const;
     const quantity = 100 + Math.floor(Math.random() * 500);
     const usedCount = Math.floor(Math.random() * quantity);
     
     return {
       id: `voucher-${i + 1}`,
       code: `${['SUMMER', 'WELCOME', 'FLASH', 'WEEKEND', 'COMBO'][i % 5]}${2024}${(i + 1).toString().padStart(2, '0')}`,
       name: names[i % names.length],
       description: 'Áp dụng cho tất cả các dịch vụ. Không áp dụng cùng các chương trình khuyến mãi khác.',
       discountType,
       discountValue: discountType === 'percentage' ? 10 + Math.floor(Math.random() * 30) : 50000 + Math.floor(Math.random() * 200000),
       minOrderValue: 500000 + Math.floor(Math.random() * 1000000),
       maxDiscount: discountType === 'percentage' ? 500000 + Math.floor(Math.random() * 500000) : undefined,
       quantity,
       usedCount,
       startDate: randomDate(new Date(2024, 0, 1), new Date()),
       endDate: randomDate(new Date(), new Date(2025, 11, 31)),
       status: statuses[Math.floor(Math.random() * 10) < 6 ? 0 : Math.floor(Math.random() * 4)],
       createdAt: randomDate(new Date(2024, 0, 1), new Date()),
       updatedAt: randomDate(new Date(2024, 6, 1), new Date()),
     };
   });
 };
 
 // Generate Reviews
 export const generateReviews = (count: number, services: Service[], users: User[]): Review[] => {
   const titles = ['Tuyệt vời!', 'Rất hài lòng', 'Đáng tiền', 'Sẽ quay lại', 'Trải nghiệm tốt', 'Khá ổn', 'Cần cải thiện'];
   const contents = [
     'Dịch vụ rất tốt, nhân viên nhiệt tình. Chắc chắn sẽ quay lại!',
     'View đẹp, đồ ăn ngon, giá cả hợp lý. Rất đáng để thử.',
     'Trải nghiệm tuyệt vời cho cả gia đình. Con cái rất thích.',
     'Hướng dẫn viên chuyên nghiệp, lịch trình hợp lý.',
     'Phòng sạch sẽ, tiện nghi đầy đủ. Giá hơi cao nhưng đáng.',
   ];
 
   const customers = users.filter(u => u.role === 'customer');
 
   return Array.from({ length: count }, (_, i) => {
     const service = services[i % services.length];
     const customer = customers[i % customers.length] || users[0];
     
     return {
       id: `review-${i + 1}`,
       serviceId: service.id,
       serviceName: service.name,
       customerId: customer.id,
       customerName: customer.fullName,
       customerAvatar: customer.avatar,
       rating: 3 + Math.floor(Math.random() * 3),
       title: titles[i % titles.length],
       content: contents[i % contents.length],
       images: Math.random() > 0.7 ? [serviceThumbnails[i % serviceThumbnails.length]] : undefined,
       helpful: Math.floor(Math.random() * 50),
       verified: Math.random() > 0.3,
       createdAt: randomDate(new Date(2024, 0, 1), new Date()),
     };
   });
 };
 
 // Generate Media
 export const generateMedia = (count: number, providerId: string): Media[] => {
   return Array.from({ length: count }, (_, i) => ({
     id: `media-${providerId}-${i + 1}`,
     providerId,
     url: serviceThumbnails[i % serviceThumbnails.length],
     type: Math.random() > 0.2 ? 'image' : 'video' as const,
     name: `file-${i + 1}.${Math.random() > 0.2 ? 'jpg' : 'mp4'}`,
     size: Math.floor(Math.random() * 5000000) + 100000,
     mimeType: Math.random() > 0.2 ? 'image/jpeg' : 'video/mp4',
     alt: `Media ${i + 1}`,
     attachedToServices: Math.random() > 0.5 ? [`service-${i + 1}`] : [],
     createdAt: randomDate(new Date(2024, 0, 1), new Date()),
   }));
 };
 
 // Initialize mock data
 export const mockUsers = generateUsers(60);
 export const mockProviders = generateProviders(25);
 export const mockServices = generateServices(80, mockProviders);
 export const mockOrders = generateOrders(100, mockServices, mockUsers);
 export const mockVouchers = generateVouchers(40);
 export const mockReviews = generateReviews(150, mockServices, mockUsers);
 
 // Dashboard stats
 export const mockAdminDashboard: DashboardStats = {
   totalOrders: mockOrders.length,
   totalRevenue: mockOrders.reduce((sum, o) => sum + o.total, 0),
   totalCustomers: mockUsers.filter(u => u.role === 'customer').length,
   totalServices: mockServices.length,
   ordersChange: 12.5,
   revenueChange: 8.3,
   recentOrders: mockOrders.slice(0, 5),
   revenueChart: Array.from({ length: 12 }, (_, i) => ({
     date: `2024-${(i + 1).toString().padStart(2, '0')}`,
     revenue: Math.floor(Math.random() * 500000000) + 100000000,
   })),
   ordersByStatus: [
     { status: 'pending', count: mockOrders.filter(o => o.status === 'pending').length },
     { status: 'confirmed', count: mockOrders.filter(o => o.status === 'confirmed').length },
     { status: 'completed', count: mockOrders.filter(o => o.status === 'completed').length },
     { status: 'cancelled', count: mockOrders.filter(o => o.status === 'cancelled').length },
   ],
 };
 
 export const mockOwnerDashboard: OwnerDashboardStats = {
   totalOrders: 45,
   totalRevenue: 125000000,
   averageRating: 4.5,
   totalServices: 12,
   ordersChange: 15.2,
   revenueChange: 10.8,
   recentOrders: mockOrders.slice(0, 5),
   revenueChart: Array.from({ length: 12 }, (_, i) => ({
     date: `2024-${(i + 1).toString().padStart(2, '0')}`,
     revenue: Math.floor(Math.random() * 50000000) + 5000000,
   })),
 };
 
 export const mockHomePageData: HomePageData = {
   heroBanners: [
     { id: '1', image: serviceThumbnails[0], title: 'Khám phá Việt Nam', subtitle: 'Hành trình di sản văn hóa', link: '/services' },
     { id: '2', image: serviceThumbnails[1], title: 'Mùa hè rực rỡ', subtitle: 'Ưu đãi đến 50%', link: '/services' },
   ],
   categories: [
     { id: '1', name: 'Tour du lịch', icon: 'Map', count: mockServices.filter(s => s.type === 'tour').length },
     { id: '2', name: 'Khách sạn', icon: 'Building2', count: mockServices.filter(s => s.type === 'hotel').length },
     { id: '3', name: 'Vé tham quan', icon: 'Ticket', count: mockServices.filter(s => s.type === 'ticket').length },
     { id: '4', name: 'Trải nghiệm', icon: 'Sparkles', count: mockServices.filter(s => s.type === 'experience').length },
   ],
   featuredServices: mockServices.filter(s => s.featured && s.status === 'published').slice(0, 8),
   topRatedServices: [...mockServices].sort((a, b) => b.rating - a.rating).slice(0, 8),
   featuredVouchers: mockVouchers.filter(v => v.status === 'active').slice(0, 4),
   popularDestinations: cities.slice(0, 6).map((city, i) => ({
     id: `dest-${i + 1}`,
     name: city,
     image: serviceThumbnails[i % serviceThumbnails.length],
     serviceCount: mockServices.filter(s => s.city === city).length,
   })),
 };
 
 // Cart (for demo)
 export const mockCart: CartItem[] = [
   {
     id: 'cart-1',
     serviceId: mockServices[0].id,
     serviceName: mockServices[0].name,
     serviceThumbnail: mockServices[0].thumbnail,
     serviceType: mockServices[0].type,
     price: mockServices[0].price,
     quantity: 2,
     travelDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
     guestCount: 2,
   },
 ];
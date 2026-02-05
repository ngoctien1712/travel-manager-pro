 import { format, formatDistanceToNow, parseISO } from 'date-fns';
 import { vi } from 'date-fns/locale';
 import type { OrderStatus, PaymentStatus, VoucherStatus, ServiceStatus, ProviderStatus, UserStatus } from '@/types/dto';
 
 // Currency formatting
 export const formatCurrency = (amount: number, currency = 'VND'): string => {
   return new Intl.NumberFormat('vi-VN', {
     style: 'currency',
     currency,
     minimumFractionDigits: 0,
     maximumFractionDigits: 0,
   }).format(amount);
 };
 
 // Short number formatting (e.g., 1.2M, 500K)
 export const formatShortNumber = (num: number): string => {
   if (num >= 1000000) {
     return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
   }
   if (num >= 1000) {
     return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
   }
   return num.toString();
 };
 
 // Date formatting
 export const formatDate = (dateString: string, formatStr = 'dd/MM/yyyy'): string => {
   try {
     return format(parseISO(dateString), formatStr, { locale: vi });
   } catch {
     return dateString;
   }
 };
 
 export const formatDateTime = (dateString: string): string => {
   return formatDate(dateString, 'HH:mm dd/MM/yyyy');
 };
 
 export const formatRelativeTime = (dateString: string): string => {
   try {
     return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: vi });
   } catch {
     return dateString;
   }
 };
 
 // Status mappings with Vietnamese labels
 export const orderStatusMap: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'muted' }> = {
   pending: { label: 'Chờ xử lý', variant: 'warning' },
   confirmed: { label: 'Đã xác nhận', variant: 'info' },
   processing: { label: 'Đang xử lý', variant: 'info' },
   completed: { label: 'Hoàn thành', variant: 'success' },
   cancelled: { label: 'Đã hủy', variant: 'error' },
   refunded: { label: 'Đã hoàn tiền', variant: 'muted' },
 };
 
 export const paymentStatusMap: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'muted' }> = {
   pending: { label: 'Chờ thanh toán', variant: 'warning' },
   paid: { label: 'Đã thanh toán', variant: 'success' },
   failed: { label: 'Thất bại', variant: 'error' },
   refunded: { label: 'Đã hoàn tiền', variant: 'muted' },
 };
 
 export const voucherStatusMap: Record<VoucherStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'muted' }> = {
   active: { label: 'Đang hoạt động', variant: 'success' },
   expired: { label: 'Hết hạn', variant: 'muted' },
   depleted: { label: 'Đã hết', variant: 'warning' },
   disabled: { label: 'Đã tắt', variant: 'error' },
 };
 
 export const serviceStatusMap: Record<ServiceStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'muted' }> = {
   draft: { label: 'Nháp', variant: 'muted' },
   published: { label: 'Đã đăng', variant: 'success' },
   unpublished: { label: 'Chưa đăng', variant: 'warning' },
   archived: { label: 'Đã lưu trữ', variant: 'muted' },
 };
 
 export const providerStatusMap: Record<ProviderStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'muted' }> = {
   pending: { label: 'Chờ duyệt', variant: 'warning' },
   approved: { label: 'Đã duyệt', variant: 'success' },
   rejected: { label: 'Từ chối', variant: 'error' },
   suspended: { label: 'Tạm ngưng', variant: 'muted' },
 };
 
 export const userStatusMap: Record<UserStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'muted' }> = {
   active: { label: 'Hoạt động', variant: 'success' },
   inactive: { label: 'Không hoạt động', variant: 'muted' },
   banned: { label: 'Bị cấm', variant: 'error' },
 };
 
 export const serviceTypeMap: Record<string, { label: string; icon: string }> = {
   tour: { label: 'Tour du lịch', icon: 'Map' },
   hotel: { label: 'Khách sạn', icon: 'Building2' },
   ticket: { label: 'Vé tham quan', icon: 'Ticket' },
   experience: { label: 'Trải nghiệm', icon: 'Sparkles' },
 };
 
 export const paymentMethodMap: Record<string, string> = {
   credit_card: 'Thẻ tín dụng',
   bank_transfer: 'Chuyển khoản',
   momo: 'MoMo',
   zalopay: 'ZaloPay',
   cash: 'Tiền mặt',
 };
 
 // Generate order number
 export const generateOrderNumber = (): string => {
   const timestamp = Date.now().toString(36).toUpperCase();
   const random = Math.random().toString(36).substring(2, 6).toUpperCase();
   return `TRV-${timestamp}-${random}`;
 };
 
 // Truncate text
 export const truncate = (text: string, length: number): string => {
   if (text.length <= length) return text;
   return text.substring(0, length) + '...';
 };
 
 // Calculate discount
 export const calculateDiscount = (
   originalPrice: number,
   discountType: 'percentage' | 'fixed',
   discountValue: number,
   maxDiscount?: number
 ): number => {
   let discount = discountType === 'percentage' 
     ? (originalPrice * discountValue) / 100 
     : discountValue;
   
   if (maxDiscount && discount > maxDiscount) {
     discount = maxDiscount;
   }
   
   return Math.min(discount, originalPrice);
 };
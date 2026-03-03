import { httpClient } from './http';

export interface Voucher {
    idVoucher: string;
    code: string;
    name: string;
    description: string;
    voucherType: 'quantity' | 'price' | 'time';
    idItem: string | null;
    idProvider: string;
    quantity: number | null;
    quality: number | null;
    totalPrice: number | null;
    quantityPay: number;
    from: string | null;
    to: string | null;
    sale: number | null;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number | null;
    minOrderValue: number;
    minQuantity: number;
    maxDiscountAmount: number | null;
    status: 'active' | 'inactive' | 'expired';
    createdAt: string;
    updatedAt: string;
    providerName?: string;
    itemTitle?: string;
}

export const voucherApi = {
    listMyVouchers: async () => {
        return httpClient.get<{ data: Voucher[] }>('/owner/vouchers');
    },
    createVoucher: async (data: Partial<Voucher>) => {
        return httpClient.post<Voucher>('/owner/vouchers', data);
    },
    updateVoucher: async (id: string, data: Partial<Voucher>) => {
        return httpClient.put<Voucher>(`/owner/vouchers/${id}`, data);
    },
    deleteVoucher: async (id: string) => {
        return httpClient.delete<{ success: boolean }>(`/owner/vouchers/${id}`);
    },
};


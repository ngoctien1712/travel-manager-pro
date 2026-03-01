import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export const OwnerOrders = () => {
    const [search, setSearch] = useState('');

    const { data: ordersData, isLoading, refetch } = useQuery({
        queryKey: ['owner-orders', search],
        queryFn: () => ownerApi.listOrders({ search }),
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-sm">Hoàn thành</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none shadow-sm">Đã xác nhận</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-sm">Đã hủy</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shadow-sm">Chờ xử lý</Badge>;
        }
    };

    return (
        <div className="page-enter">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <PageHeader
                    title="Đơn hàng"
                    description="Quản lý và theo dõi các đơn đặt dịch vụ của khách hàng"
                />
                <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Tìm kiếm mã đơn, tên khách..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 rounded-1.5xl bg-white focus:bg-white shadow-sm"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()} className="h-11 w-11 rounded-1.5xl bg-white shrink-0">
                        <RefreshCw size={18} />
                    </Button>
                </div>
            </div>

            <Card className="card-elevated border-none">
                <CardContent className="p-0">
                    <div className="overflow-x-auto rounded-3xl">
                        <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold text-slate-500 py-5">Mã đơn</TableHead>
                                    <TableHead className="font-bold text-slate-500 py-5">Khách hàng</TableHead>
                                    <TableHead className="font-bold text-slate-500 py-5">Dịch vụ</TableHead>
                                    <TableHead className="font-bold text-slate-500 py-5">Ngày đặt</TableHead>
                                    <TableHead className="font-bold text-slate-500 py-5">Tổng tiền</TableHead>
                                    <TableHead className="font-bold text-slate-500 py-5">Trạng thái</TableHead>
                                    <TableHead className="text-right font-bold text-slate-500 py-5">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7} className="h-16 animate-pulse bg-slate-50/50" />
                                        </TableRow>
                                    ))
                                ) : ordersData?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                                            Không tìm thấy đơn hàng nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ordersData?.data.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                                            <TableCell className="py-4 font-semibold text-slate-700">#{order.orderNumber}</TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-bold text-slate-800">{order.customerName}</p>
                                            </TableCell>
                                            <TableCell className="py-4 max-w-[200px]">
                                                <p className="truncate font-medium text-slate-700" title={order.items?.[0]?.serviceName}>
                                                    {order.items?.[0]?.serviceName || 'N/A'} {order.items?.length > 1 && `(+${order.items.length - 1})`}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 font-medium text-slate-600">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="py-4 font-bold text-slate-900">
                                                {formatCurrency(order.total)}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                                    <Eye size={16} className="mr-2" />
                                                    Chi tiết
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Phân trang (Mock Pagination Placeholder) */}
            {!isLoading && ordersData && ordersData.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <p className="text-sm font-medium text-slate-500">Trang {ordersData.page} / {ordersData.totalPages}</p>
                </div>
            )}
        </div>
    );
};

export default OwnerOrders;

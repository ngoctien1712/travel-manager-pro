import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Eye,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    MoreHorizontal
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { Order } from '@/types/dto';

export const OwnerOrders = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: ordersData, isLoading, refetch } = useQuery({
        queryKey: ['owner-orders', search, statusFilter],
        queryFn: () => ownerApi.listOrders({
            search,
            status: statusFilter === 'all' ? undefined : statusFilter
        }),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Order['status'] }) =>
            ownerApi.updateOrderStatus(id, status),
        onSuccess: () => {
            refetch();
            toast.success('Cập nhật trạng thái đơn hàng thành công');
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    });

    const handleUpdateStatus = (id: string, status: Order['status']) => {
        updateStatusMutation.mutate({ id, status });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-sm px-3 py-1 rounded-full font-bold flex items-center w-fit"><CheckCircle size={12} className="mr-1" /> Hoàn thành</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none shadow-sm px-3 py-1 rounded-full font-bold flex items-center w-fit"><CheckCircle size={12} className="mr-1" /> Đã xác nhận</Badge>;
            case 'processing':
                return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none shadow-sm px-3 py-1 rounded-full font-bold flex items-center w-fit"><RefreshCw size={12} className="mr-1 animate-spin-slow" /> Đang xử lý</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-sm px-3 py-1 rounded-full font-bold flex items-center w-fit"><XCircle size={12} className="mr-1" /> Đã hủy</Badge>;
            case 'pending':
            default:
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shadow-sm px-3 py-1 rounded-full font-bold flex items-center w-fit"><Clock size={12} className="mr-1" /> Chờ xử lý</Badge>;
        }
    };

    const renderActions = (order: Order) => {
        const isPending = order.status === 'pending';
        const isConfirmed = order.status === 'confirmed';
        const isProcessing = order.status === 'processing';

        return (
            <div className="flex items-center justify-end gap-2">
                {isPending && (
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl shadow-sm border-none shadow-emerald-200"
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            disabled={updateStatusMutation.isPending}
                        >
                            <CheckCircle size={14} className="mr-1.5" />
                            Xác nhận
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold px-4 rounded-xl"
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            disabled={updateStatusMutation.isPending}
                        >
                            Từ chối
                        </Button>
                    </>
                )}

                {(isConfirmed || isProcessing) && (
                    <Button
                        variant="default"
                        size="sm"
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl shadow-sm border-none shadow-emerald-200"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={updateStatusMutation.isPending}
                    >
                        <CheckCircle size={14} className="mr-1.5" />
                        Hoàn thành
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                            <MoreHorizontal size={18} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-slate-100">
                        <DropdownMenuItem className="cursor-pointer font-bold py-2.5 rounded-xl flex items-center">
                            <Eye size={16} className="mr-2.5 text-slate-400" /> Chi tiết đơn
                        </DropdownMenuItem>
                        {isConfirmed && (
                            <DropdownMenuItem
                                className="cursor-pointer font-bold py-2.5 rounded-xl flex items-center text-indigo-600"
                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                            >
                                <RefreshCw size={16} className="mr-2.5" /> Đang xử lý
                            </DropdownMenuItem>
                        )}
                        {!['cancelled', 'completed', 'refunded'].includes(order.status) && (
                            <DropdownMenuItem
                                className="cursor-pointer font-bold py-2.5 rounded-xl flex items-center text-red-600"
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            >
                                <XCircle size={16} className="mr-2.5" /> Hủy bỏ đơn
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    return (
        <div className="page-enter max-w-[1400px] mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                <PageHeader
                    title="Đơn hàng"
                    description="Quản lý và theo dõi các đơn đặt dịch vụ của khách hàng"
                />

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <Input
                            placeholder="Tìm kiếm mã đơn, tên khách..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-xl shadow-slate-200/40 focus:ring-2 focus:ring-blue-500/20 text-base font-medium placeholder:text-slate-400 transition-all"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()} className="h-14 w-14 rounded-2xl bg-white shrink-0 border-none shadow-xl shadow-slate-200/40 hover:bg-slate-50 transition-all active:scale-95">
                        <RefreshCw size={22} className={`${isLoading ? "animate-spin text-blue-500" : "text-slate-600"}`} />
                    </Button>
                </div>
            </div>

            <div className="mb-8 overflow-x-auto no-scrollbar py-2">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                    <TabsList className="bg-slate-100/50 p-1.5 h-14 rounded-2.5xl border border-slate-200/30 w-fit">
                        <TabsTrigger value="all" className="rounded-2xl px-6 font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all">Tất cả</TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-2xl px-6 font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-600 transition-all">Chờ xử lý</TabsTrigger>
                        <TabsTrigger value="confirmed" className="rounded-2xl px-6 font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all">Đã xác nhận</TabsTrigger>
                        <TabsTrigger value="processing" className="rounded-2xl px-6 font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all">Đang xử lý</TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-2xl px-6 font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all">Hoàn thành</TabsTrigger>
                        <TabsTrigger value="cancelled" className="rounded-2xl px-6 font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-red-600 transition-all">Đã hủy</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pl-10">Mã đơn</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Khách hàng</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Dịch vụ</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Ngày đặt</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Tổng tiền</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Trạng thái</TableHead>
                                    <TableHead className="text-right font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pr-10">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7} className="p-10">
                                                <div className="h-4 w-full animate-pulse bg-slate-100 rounded-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : ordersData?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-80 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                                                    <Search size={48} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-900 font-black text-xl">Rất tiếc!</p>
                                                    <p className="text-slate-400 font-medium tracking-tight">Chúng tôi không tìm thấy đơn hàng nào phù hợp.</p>
                                                </div>
                                                <Button
                                                    variant="link"
                                                    onClick={() => { setStatusFilter('all'); setSearch(''); }}
                                                    className="text-blue-600 font-black uppercase tracking-widest text-xs hover:no-underline hover:text-blue-700"
                                                >
                                                    Xóa tất cả bộ lọc
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ordersData?.data.map((order) => (
                                        <TableRow key={order.id} className="group hover:bg-slate-50/40 border-b border-slate-50 transition-all duration-300">
                                            <TableCell className="py-8 pl-10 font-black text-slate-900 text-base">
                                                <span className="text-slate-300 font-medium mr-0.5">#</span>{order.orderNumber}
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{order.customerName}</p>
                                                    <div className="flex items-center text-slate-400 font-bold text-xs">
                                                        <span>{order.customerPhone}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8 max-w-[240px]">
                                                <p className="truncate font-black text-slate-600" title={order.items?.[0]?.serviceName}>
                                                    {order.items?.[0]?.serviceName || 'N/A'}
                                                    {order.items?.length > 1 && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded-lg text-slate-400 font-black text-[9px] uppercase">+{order.items.length - 1} khác</span>
                                                    )}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-8 font-bold text-slate-500 text-sm">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="py-8 font-black text-slate-900 text-base">
                                                {formatCurrency(order.total)}
                                            </TableCell>
                                            <TableCell className="py-8">
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="py-8 text-right pr-10">
                                                {renderActions(order)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {!isLoading && ordersData && ordersData.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-10 px-6 gap-6">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Hiển thị {ordersData.data.length} / {ordersData.total} ĐƠN HÀNG</p>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="rounded-xl font-black text-xs uppercase h-10 px-6 border-slate-200">Trước</Button>
                        <p className="text-sm font-black text-slate-900 mx-2">{ordersData.page}</p>
                        <Button variant="outline" size="sm" className="rounded-xl font-black text-xs uppercase h-10 px-6 border-slate-200">Tiếp</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerOrders;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherApi, type Voucher } from '@/api/voucher.api';
import { ownerGeographyApi } from '@/api/owner-geography.api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus,
    Loader2,
    Search,
    Edit2,
    Trash2,
    Ticket,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Copy,
    ChevronRight,
    Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function Vouchers() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

    // Form states
    const [formData, setFormData] = useState<Partial<Voucher>>({
        code: '',
        name: '',
        description: '',
        voucherType: 'price',
        idProvider: '',
        idItem: null,
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        minQuantity: 0,
        maxDiscountAmount: 0,
        quantity: 0,
        from: '',
        to: '',
        status: 'active'
    });

    // Queries
    const { data: vouchersData, isLoading: isLoadingVouchers } = useQuery({
        queryKey: ['owner', 'vouchers'],
        queryFn: () => voucherApi.listMyVouchers(),
    });
    const vouchers = vouchersData?.data ?? [];

    const { data: providersData } = useQuery({
        queryKey: ['owner', 'providers'],
        queryFn: () => ownerGeographyApi.getMyProviders(),
    });
    const providers = providersData?.data ?? [];

    const { data: servicesData } = useQuery({
        queryKey: ['owner', 'provider-services', formData.idProvider],
        queryFn: () => ownerGeographyApi.listMyBookableItems(formData.idProvider!),
        enabled: !!formData.idProvider,
    });
    const services = servicesData?.data ?? [];

    // Mutations
    const createMut = useMutation({
        mutationFn: (data: Partial<Voucher>) => voucherApi.createVoucher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner', 'vouchers'] });
            toast.success('Đã tạo voucher thành công');
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Lỗi khi tạo voucher');
        }
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Voucher> }) =>
            voucherApi.updateVoucher(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner', 'vouchers'] });
            toast.success('Đã cập nhật voucher');
            setIsDialogOpen(false);
            setEditingVoucher(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Lỗi khi cập nhật voucher');
        }
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => voucherApi.deleteVoucher(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner', 'vouchers'] });
            toast.success('Đã xóa voucher');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Không thể xóa voucher này');
        }
    });

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            voucherType: 'price',
            idProvider: '',
            idItem: null,
            discountType: 'percentage',
            discountValue: 0,
            minOrderValue: 0,
            minQuantity: 0,
            maxDiscountAmount: 0,
            quantity: 0,
            from: '',
            to: '',
            status: 'active'
        });
        setEditingVoucher(null);
    };

    const handleEdit = (v: Voucher) => {
        setEditingVoucher(v);
        setFormData({
            code: v.code,
            name: v.name,
            description: v.description,
            voucherType: v.voucherType || 'price',
            idProvider: v.idProvider,
            idItem: v.idItem,
            discountType: v.discountType,
            discountValue: v.discountValue,
            minOrderValue: v.minOrderValue,
            minQuantity: v.minQuantity,
            maxDiscountAmount: v.maxDiscountAmount,
            quantity: v.quantity,
            from: (v.from && !isNaN(new Date(v.from).getTime())) ? format(new Date(v.from), 'yyyy-MM-dd') : '',
            to: (v.to && !isNaN(new Date(v.to).getTime())) ? format(new Date(v.to), 'yyyy-MM-dd') : '',
            status: v.status
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.code || !formData.name || !formData.idProvider || !formData.discountValue) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        const payload = {
            ...formData,
            from: formData.from ? `${formData.from}T00:00:00` : null,
            to: formData.to ? `${formData.to}T23:59:59` : null
        };

        if (editingVoucher) {
            updateMut.mutate({ id: editingVoucher.idVoucher, data: payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const filteredVouchers = vouchers.filter(v =>
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.providerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: vouchers.length,
        active: vouchers.filter(v => v.status === 'active').length,
        inactive: vouchers.filter(v => v.status === 'inactive').length,
        used: vouchers.reduce((acc, v) => acc + (v.quantityPay || 0), 0)
    };

    const formatCurrency = (val: number | null) => {
        if (val === null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Quản lý Voucher"
                description="Tạo các chương trình khuyến mãi theo số lượng, giá trị đơn hàng hoặc thời gian để thu hút khách hàng."
            />

            {/* Stats Section */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-600 font-medium">Tổng Voucher</CardDescription>
                        <CardTitle className="text-2xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-green-600 font-medium">Đang hoạt động</CardDescription>
                        <CardTitle className="text-2xl">{stats.active}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-orange-600 font-medium">Đã sử dụng</CardDescription>
                        <CardTitle className="text-2xl">{stats.used}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-600 font-medium">Ngừng hoạt động</CardDescription>
                        <CardTitle className="text-2xl">{stats.inactive}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Danh sách Voucher</CardTitle>
                        <CardDescription>Tìm kiếm và quản lý các mã giảm giá của bạn</CardDescription>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm mã hoặc tên..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Tạo Voucher
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Voucher</TableHead>
                                    <TableHead>Giá trị giảm</TableHead>
                                    <TableHead>Điều kiện</TableHead>
                                    <TableHead>Thời hạn</TableHead>
                                    <TableHead>Lượt dùng</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingVouchers ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredVouchers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Không tìm thấy voucher nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredVouchers.map((v) => (
                                        <TableRow key={v.idVoucher}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <Ticket className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg tracking-wider text-primary">{v.code}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(v.code);
                                                                    toast.success('Đã sao chép mã');
                                                                }}
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-xs font-medium text-foreground">{v.name}</div>
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <ChevronRight className="h-3 w-3" /> {v.providerName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {v.discountType === 'percentage' ? (
                                                    <div className="space-y-1">
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 uppercase font-bold px-2 py-1">
                                                            Giảm {v.discountValue}%
                                                        </Badge>
                                                        {v.maxDiscountAmount && v.maxDiscountAmount > 0 && (
                                                            <div className="text-[10px] text-muted-foreground italic">
                                                                Tối đa {formatCurrency(v.maxDiscountAmount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase font-bold px-2 py-1">
                                                        Giảm {formatCurrency(v.discountValue)}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    {v.voucherType === 'quantity' && (
                                                        <div className="flex items-center gap-1 text-blue-600 font-medium">
                                                            <Package className="h-3 w-3" /> Đặt từ {v.minQuantity} lượt
                                                        </div>
                                                    )}
                                                    {v.voucherType === 'price' && (
                                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                                            <div className="h-3 w-3 flex items-center justify-center text-[10px] border border-green-600 rounded-full">$</div>
                                                            Đơn từ {formatCurrency(v.minOrderValue)}
                                                        </div>
                                                    )}
                                                    {v.voucherType === 'time' && (
                                                        <div className="flex items-center gap-1 text-purple-600 font-medium">
                                                            <Clock className="h-3 w-3" /> Theo thời gian
                                                        </div>
                                                    )}
                                                    {v.itemTitle ? (
                                                        <div className="text-primary truncate max-w-[150px]">Dịch vụ: {v.itemTitle}</div>
                                                    ) : (
                                                        <div className="text-muted-foreground">Tất cả dịch vụ</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {v.from || v.to ? (
                                                        <>
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {v.from ? format(new Date(v.from.split('T')[0]), 'dd/MM/yyyy') : '...'} - {v.to ? format(new Date(v.to.split('T')[0]), 'dd/MM/yyyy') : '...'}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Không giới hạn</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium">
                                                        {v.quantityPay || 0} / {v.quantity || '∞'}
                                                    </div>
                                                    {v.quantity && v.quantity > 0 && (
                                                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{ width: `${Math.min(((v.quantityPay || 0) / v.quantity) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {v.status === 'active' ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Hoạt động
                                                    </Badge>
                                                ) : v.status === 'expired' ? (
                                                    <Badge variant="outline" className="text-orange-500 border-orange-500 gap-1">
                                                        <Clock className="h-3 w-3" /> Hết hạn
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <XCircle className="h-3 w-3" /> Ngừng
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(v)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (confirm('Bạn có chắc chắn muốn xóa voucher này? Nếu đã được sử dụng, hành động này sẽ thất bại.')) {
                                                                deleteMut.mutate(v.idVoucher);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}</DialogTitle>
                        <CardDescription>Cung cấp mã ưu đãi cho khách hàng của bạn.</CardDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="flex items-center gap-1 font-bold">Mã Voucher <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <Input
                                        id="code"
                                        placeholder="VÍ DỤ: MUAHE2024"
                                        className="font-mono font-bold tracking-widest uppercase"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="absolute right-0 top-0 h-full text-xs"
                                        onClick={() => setFormData({ ...formData, code: `PROMO${Math.random().toString(36).substring(7).toUpperCase()}` })}
                                    >
                                        Tự tạo mã
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-bold">Tên Voucher <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="Ví dụ: Giảm giá hè rực rỡ"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold">Nhà cung cấp áp dụng <span className="text-destructive">*</span></Label>
                                <Select
                                    value={formData.idProvider}
                                    onValueChange={val => setFormData({ ...formData, idProvider: val, idItem: null })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn nhà cung cấp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold">Dịch vụ áp dụng cụ thể</Label>
                                <Select
                                    value={formData.idItem || 'all'}
                                    onValueChange={val => setFormData({ ...formData, idItem: val === 'all' ? null : val })}
                                    disabled={!formData.idProvider}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả dịch vụ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả dịch vụ</SelectItem>
                                        {services.map(s => (
                                            <SelectItem key={s.idItem} value={s.idItem}>{s.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Để trống để áp dụng cho toàn bộ dịch vụ của nhà cung cấp này.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc" className="font-bold">Mô tả chương trình</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="Chi tiết về chương trình khuyến mãi..."
                                    className="resize-none h-20"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Right Column: Values & Rules */}
                        <div className="space-y-4">
                            <div className="space-y-2 pb-2 border-b border-dashed">
                                <Label className="font-bold text-primary flex items-center gap-2">
                                    <Ticket className="h-4 w-4" /> Loại chương trình Voucher
                                </Label>
                                <Select
                                    value={formData.voucherType}
                                    onValueChange={(val: any) => setFormData({ ...formData, voucherType: val })}
                                >
                                    <SelectTrigger className="bg-primary/5 border-primary/20 font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quantity">Theo số lượng (Đặt nhiều giảm nhiều)</SelectItem>
                                        <SelectItem value="price">Theo giá trị đơn hàng (Min Spend)</SelectItem>
                                        <SelectItem value="time">Theo thời gian (Sale sự kiện/tuần)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold">Loại giảm giá</Label>
                                    <Select
                                        value={formData.discountType}
                                        onValueChange={(val: any) => setFormData({ ...formData, discountType: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Theo %</SelectItem>
                                            <SelectItem value="fixed_amount">Số tiền cố định</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="val" className="font-bold">Giá trị giảm <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            id="val"
                                            type="number"
                                            className="pr-10"
                                            value={formData.discountValue}
                                            onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                        />
                                        <span className="absolute right-3 top-2.5 text-muted-foreground font-bold">
                                            {formData.discountType === 'percentage' ? '%' : '₫'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 bg-muted/30 p-3 rounded-lg border">
                                <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Điều kiện áp dụng
                                </div>

                                {formData.voucherType === 'price' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="min" className="font-bold text-xs text-green-700">Giá trị đơn hàng tối thiểu (₫)</Label>
                                        <Input
                                            id="min"
                                            type="number"
                                            className="border-green-200 focus-visible:ring-green-500"
                                            placeholder="Ví dụ: 500000"
                                            value={formData.minOrderValue}
                                            onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                                        />
                                    </div>
                                )}

                                {formData.voucherType === 'quantity' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="minQty" className="font-bold text-xs text-blue-700">Số lượng đặt tối thiểu (lượt/vé)</Label>
                                        <Input
                                            id="minQty"
                                            type="number"
                                            className="border-blue-200 focus-visible:ring-blue-500"
                                            placeholder="Ví dụ: 5"
                                            value={formData.minQuantity}
                                            onChange={e => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                                        />
                                    </div>
                                )}

                                {formData.voucherType === 'time' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-purple-50/30 p-3 rounded-lg border border-purple-100">
                                        <div className="space-y-2">
                                            <Label htmlFor="from" className="font-bold text-xs text-purple-700 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> Từ ngày
                                            </Label>
                                            <Input
                                                id="from"
                                                type="date"
                                                className="border-purple-200 focus-visible:ring-purple-500 w-full bg-white"
                                                value={formData.from}
                                                onChange={e => setFormData({ ...formData, from: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="to" className="font-bold text-xs text-purple-700 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> Đến ngày
                                            </Label>
                                            <Input
                                                id="to"
                                                type="date"
                                                className="border-purple-200 focus-visible:ring-purple-500 w-full bg-white"
                                                value={formData.to}
                                                onChange={e => setFormData({ ...formData, to: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {(formData.voucherType === 'price' || formData.voucherType === 'quantity') && formData.discountType === 'percentage' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="max" className="font-bold text-xs">Giảm tối đa (₫)</Label>
                                        <Input
                                            id="max"
                                            type="number"
                                            placeholder="Không giới hạn"
                                            value={formData.maxDiscountAmount}
                                            onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="qty" className="font-bold">Số lượng voucher phát hành</Label>
                                <div className="relative">
                                    <Input
                                        id="qty"
                                        type="number"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-muted-foreground pt-1 italic">Tổng số lượt người dùng có thể săn mã này. Để 0 nếu không giới hạn.</p>
                                </div>
                            </div>

                            {formData.voucherType !== 'time' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="from-alt" className="font-bold text-xs">Hạn từ</Label>
                                        <Input
                                            id="from-alt"
                                            type="date"
                                            className="w-full"
                                            value={formData.from}
                                            onChange={e => setFormData({ ...formData, from: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="to-alt" className="font-bold text-xs">Hạn đến</Label>
                                        <Input
                                            id="to-alt"
                                            type="date"
                                            className="w-full"
                                            value={formData.to}
                                            onChange={e => setFormData({ ...formData, to: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {editingVoucher && (
                                <div className="space-y-2">
                                    <Label className="font-bold">Trạng thái</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Đang hoạt động</SelectItem>
                                            <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                                            <SelectItem value="expired">Đã hết hạn</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createMut.isPending || updateMut.isPending}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                            {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

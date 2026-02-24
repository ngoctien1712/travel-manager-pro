import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerGeographyApi, type OwnerProvider } from '@/api/owner-geography.api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Loader2, ExternalLink, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export const MyServices = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Create Service States
    const [serviceOpen, setServiceOpen] = useState(false);
    const [serviceProviderId, setServiceProviderId] = useState('');
    const [itemType, setItemType] = useState<'tour' | 'accommodation' | 'vehicle' | 'ticket'>('tour');
    const [serviceTitle, setServiceTitle] = useState('');
    const [servicePrice, setServicePrice] = useState<string>('');

    // Extra fields for service types
    const [tourGuideLang, setTourGuideLang] = useState('Tiếng Việt');
    const [tourStart, setTourStart] = useState('');
    const [tourEnd, setTourEnd] = useState('');
    const [accAddress, setAccAddress] = useState('');
    const [ticketKind, setTicketKind] = useState('');

    const { data: providersData } = useQuery({
        queryKey: ['owner', 'providers'],
        queryFn: () => ownerGeographyApi.getMyProviders(),
    });
    const providers = providersData?.data ?? [];

    const { data: servicesData, isLoading } = useQuery({
        queryKey: ['owner', 'all-services'],
        queryFn: () => ownerGeographyApi.listAllMyBookableItems(),
    });
    const services = servicesData?.data ?? [];

    const createServiceMut = useMutation({
        mutationFn: (d: {
            providerId: string;
            itemType: 'tour' | 'accommodation' | 'vehicle' | 'ticket';
            title: string;
            price?: number;
            extraData?: any;
        }) => ownerGeographyApi.createBookableItem(d),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner', 'all-services'] });
            setServiceOpen(false);
            setServiceProviderId('');
            setServiceTitle('');
            setServicePrice('');
            setTourGuideLang('Tiếng Việt');
            setTourStart('');
            setTourEnd('');
            setAccAddress('');
            setTicketKind('');
        },
    });

    const filteredServices = services.filter((s: any) => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.providerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || s.itemType === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'tour': return <Badge variant="default">Tour</Badge>;
            case 'accommodation': return <Badge variant="secondary">Lưu trú</Badge>;
            case 'vehicle': return <Badge variant="outline">Phương tiện</Badge>;
            default: return <Badge>{type}</Badge>;
        }
    };

    return (
        <>
            <PageHeader
                title="Dịch vụ của tôi"
                description="Quản lý tất cả các dịch vụ du lịch, lưu trú và vận chuyển của bạn"
            />

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Tìm kiếm</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm theo tên dịch vụ hoặc nhà cung cấp..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48 space-y-2">
                            <Label>Loại dịch vụ</Label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="tour">Tour</SelectItem>
                                    <SelectItem value="accommodation">Lưu trú</SelectItem>
                                    <SelectItem value="vehicle">Phương tiện</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => setServiceOpen(true)} className="gradient-sunset border-none">
                            <Plus className="h-4 w-4 mr-2" /> Tạo dịch vụ mới
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách dịch vụ ({filteredServices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dịch vụ</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead>Nhà cung cấp</TableHead>
                                    <TableHead>Khu vực</TableHead>
                                    <TableHead>Giá (VNĐ)</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredServices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Không tìm thấy dịch vụ nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredServices.map((s: any) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.title}</TableCell>
                                            <TableCell>{getTypeBadge(s.itemType)}</TableCell>
                                            <TableCell>{s.providerName}</TableCell>
                                            <TableCell>{s.areaName}</TableCell>
                                            <TableCell>{s.price ? s.price.toLocaleString() : 'Liên hệ'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link to={`/owner/services/${s.id}`}>
                                                        Chi tiết <ExternalLink className="ml-2 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tạo dịch vụ mới</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nhà cung cấp</Label>
                                <Select value={serviceProviderId} onValueChange={setServiceProviderId}>
                                    <SelectTrigger><SelectValue placeholder="Chọn nhà cung cấp" /></SelectTrigger>
                                    <SelectContent>
                                        {providers.filter((p: any) => p.status === 'active').map((p: OwnerProvider) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.areaName})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {providers.filter((p: any) => p.status === 'active').length === 0 && (
                                    <p className="text-[10px] text-destructive italic">Bạn cần ít nhất 1 nhà cung cấp đã được duyệt</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Loại dịch vụ</Label>
                                <Select value={itemType} onValueChange={(v) => setItemType(v as 'tour' | 'accommodation' | 'vehicle' | 'ticket')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tour">Tour du lịch</SelectItem>
                                        <SelectItem value="accommodation">Chỗ ở (Khách sạn, Homestay...)</SelectItem>
                                        <SelectItem value="vehicle">Phương tiện đi lại</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tên dịch vụ</Label>
                            <Input
                                value={serviceTitle}
                                onChange={(e) => setServiceTitle(e.target.value)}
                                placeholder={
                                    itemType === 'tour' ? "Ví dụ: Tour Hạ Long 2 ngày 1 đêm" :
                                        itemType === 'accommodation' ? "Ví dụ: Khách sạn Mường Thanh Luxury" :
                                            "Nhập tên dịch vụ..."
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Giá cơ bản (VNĐ)</Label>
                            <Input type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="0" />
                            <p className="text-[10px] text-muted-foreground">Giá này sẽ hiển thị như giá khởi điểm cho dịch vụ của bạn.</p>
                        </div>

                        <div className="border-t pt-4 mt-2">
                            <h4 className="text-sm font-semibold mb-4">Thông tin chi tiết đặc thù</h4>

                            {itemType === 'tour' && (
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Ngôn ngữ hướng dẫn viên</Label>
                                        <Input value={tourGuideLang} onChange={(e) => setTourGuideLang(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Thời gian khởi hành (Dự kiến)</Label>
                                            <Input type="datetime-local" value={tourStart} onChange={(e) => setTourStart(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Thời gian kết thúc (Dự kiến)</Label>
                                            <Input type="datetime-local" value={tourEnd} onChange={(e) => setTourEnd(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {itemType === 'accommodation' && (
                                <div className="space-y-2">
                                    <Label>Địa chỉ chi tiết</Label>
                                    <Input value={accAddress} onChange={(e) => setAccAddress(e.target.value)} placeholder="Số nhà, tên đường, phường/xã..." />
                                </div>
                            )}

                            {itemType === 'ticket' && (
                                <div className="space-y-2">
                                    <Label>Loại vé</Label>
                                    <Input value={ticketKind} onChange={(e) => setTicketKind(e.target.value)} placeholder="Ví dụ: Vé người lớn, Vé trẻ em, Vé VIP..." />
                                </div>
                            )}

                            {itemType === 'vehicle' && (
                                <p className="text-sm text-muted-foreground italic">Thiết lập chi tiết loại xe trong trang quản lý chi tiết sau khi tạo.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setServiceOpen(false)}>Hủy</Button>
                        <Button
                            className="gradient-sunset border-none"
                            onClick={() => {
                                if (serviceProviderId && serviceTitle) {
                                    let extraData = {};
                                    if (itemType === 'tour') {
                                        extraData = { guideLanguage: tourGuideLang, startAt: tourStart, endAt: tourEnd };
                                    } else if (itemType === 'accommodation') {
                                        extraData = { address: accAddress };
                                    } else if (itemType === 'ticket') {
                                        extraData = { ticketKind };
                                    }

                                    createServiceMut.mutate({
                                        providerId: serviceProviderId,
                                        itemType,
                                        title: serviceTitle,
                                        price: servicePrice ? Number(servicePrice) : undefined,
                                        extraData
                                    });
                                }
                            }}
                            disabled={!serviceProviderId || !serviceTitle || createServiceMut.isPending}
                        >
                            {createServiceMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Tạo dịch vụ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MyServices;

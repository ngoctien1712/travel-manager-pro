import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geographyApi } from '@/api/geography.api';
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
    const [provinceId, setProvinceId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [wardId, setWardId] = useState('');
    const [specificAddress, setSpecificAddress] = useState('');
    const [ticketKind, setTicketKind] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departurePoint, setDeparturePoint] = useState('');
    const [arrivalPoint, setArrivalPoint] = useState('');
    const [tourType, setTourType] = useState<'group' | 'private' | 'daily'>('group');
    const [maxSlots, setMaxSlots] = useState<string>('20');
    const [error, setError] = useState('');

    const [provinces, setProvinces] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    // Fetch Provinces (Cities) for Vietnam
    useEffect(() => {
        if (serviceOpen) {
            geographyApi.listCountries().then(res => {
                const vn = res.data.find((c: any) => c.code === 'VN' || c.name === 'Vietnam');
                const countryId = vn?.id || res.data[0]?.id;
                if (countryId) {
                    geographyApi.listCities(countryId).then(cityRes => {
                        setProvinces(cityRes.data);
                    });
                }
            });
        }
    }, [serviceOpen]);

    // Fetch Wards directly from Province
    useEffect(() => {
        if (provinceId) {
            geographyApi.listAreas(provinceId).then(res => setWards(res.data));
        } else {
            setWards([]);
            setWardId('');
        }
    }, [provinceId]);

    const { data: providersData } = useQuery({
        queryKey: ['owner', 'providers'],
        queryFn: () => ownerGeographyApi.getMyProviders(),
    });
    const providers = providersData?.data ?? [];

    // Auto-set itemType when provider changes
    useEffect(() => {
        if (serviceProviderId) {
            const provider = providers.find((p: any) => p.id === serviceProviderId);
            if (provider && provider.serviceType) {
                setItemType(provider.serviceType as 'tour' | 'accommodation' | 'vehicle' | 'ticket');
            }
        }
    }, [serviceProviderId, providers]);

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
            attribute?: any;
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
            setProvinceId('');
            setDistrictId('');
            setWardId('');
            setSpecificAddress('');
            setTicketKind('');
            setDepartureDate('');
            setArrivalDate('');
            setDepartureTime('');
            setArrivalTime('');
            setDeparturePoint('');
            setArrivalPoint('');
            setTourType('group');
            setMaxSlots('20');
            setError('');
        },
        onError: (err: any) => {
            setError(err.message || 'Tạo dịch vụ thất bại');
        }
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
                                        <TableRow key={s.idItem}>
                                            <TableCell className="font-medium">{s.title}</TableCell>
                                            <TableCell>{getTypeBadge(s.itemType)}</TableCell>
                                            <TableCell>{s.providerName}</TableCell>
                                            <TableCell>{s.areaName}</TableCell>
                                            <TableCell>{s.price ? s.price.toLocaleString() : 'Liên hệ'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link to={`/owner/services/${s.idItem}`}>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                <Select value={itemType} onValueChange={(v) => setItemType(v as 'tour' | 'accommodation' | 'vehicle' | 'ticket')} disabled={!!serviceProviderId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tour">Tour du lịch</SelectItem>
                                        <SelectItem value="accommodation">Chỗ ở (Khách sạn, Homestay...)</SelectItem>
                                        <SelectItem value="vehicle">Phương tiện đi lại</SelectItem>
                                    </SelectContent>
                                </Select>
                                {serviceProviderId && <p className="text-[10px] text-muted-foreground italic">Loại dịch vụ được cố định theo nhà cung cấp</p>}
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Loại hình tour</Label>
                                            <Select value={tourType} onValueChange={(v) => setTourType(v as any)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="group">Tour ghép (Group)</SelectItem>
                                                    <SelectItem value="private">Tour riêng (Private)</SelectItem>
                                                    <SelectItem value="daily">Tour hàng ngày (Daily)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Số chỗ tối đa</Label>
                                            <Input type="number" value={maxSlots} onChange={(e) => setMaxSlots(e.target.value)} />
                                        </div>
                                    </div>
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
                                    {tourType === 'daily' && (
                                        <p className="text-[10px] text-blue-600 italic">Lưu ý: Tour hàng ngày sẽ tạo ra nhiều bản ghi tương ứng với số ngày trong khoảng thời gian đã chọn.</p>
                                    )}
                                </div>
                            )}

                            {itemType === 'accommodation' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tỉnh / Thành phố</Label>
                                            <Select value={provinceId} onValueChange={(v) => { setProvinceId(v); setWardId(''); }}>
                                                <SelectTrigger><SelectValue placeholder="Chọn Tỉnh / Thành phố" /></SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map(p => <SelectItem key={p.id} value={p.id}>{p.nameVi || p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phường / Xã</Label>
                                            <Select value={wardId} onValueChange={setWardId} disabled={!provinceId}>
                                                <SelectTrigger><SelectValue placeholder="Chọn Phường / Xã" /></SelectTrigger>
                                                <SelectContent>
                                                    {wards.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Số nhà, tên đường</Label>
                                        <Input value={specificAddress} onChange={(e) => setSpecificAddress(e.target.value)} placeholder="Ví dụ: 123 đường Hùng Vương" />
                                    </div>
                                </div>
                            )}

                            {itemType === 'ticket' && (
                                <div className="space-y-2">
                                    <Label>Loại vé</Label>
                                    <Input value={ticketKind} onChange={(e) => setTicketKind(e.target.value)} placeholder="Ví dụ: Vé người lớn, Vé trẻ em, Vé VIP..." />
                                </div>
                            )}

                            {itemType === 'vehicle' && (
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ngày khởi hành</Label>
                                            <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Giờ khởi hành</Label>
                                            <Input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ngày đến</Label>
                                            <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Giờ đến</Label>
                                            <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Điểm đón</Label>
                                            <Input value={departurePoint} onChange={(e) => setDeparturePoint(e.target.value)} placeholder="Ví dụ: Bến xe Mỹ Đình" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Điểm đến</Label>
                                            <Input value={arrivalPoint} onChange={(e) => setArrivalPoint(e.target.value)} placeholder="Ví dụ: Bến xe Bãi Cháy" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Giờ khởi hành phải cách hiện tại ít nhất 12 tiếng. Nếu cùng ngày, giờ đến phải sau giờ khởi hành.</p>
                                </div>
                            )}
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setServiceOpen(false)}>Hủy</Button>
                        <Button
                            className="gradient-sunset border-none"
                            onClick={() => {
                                if (serviceProviderId && serviceTitle) {
                                    let extraData = {};
                                    let attributeData = {};
                                    if (itemType === 'tour') {
                                        extraData = { guideLanguage: tourGuideLang, startAt: tourStart, endAt: tourEnd, tourType, maxSlots };
                                    } else if (itemType === 'accommodation') {
                                        extraData = {
                                            address: specificAddress,
                                            provinceId,
                                            wardId,
                                            specificAddress
                                        };
                                    } else if (itemType === 'ticket') {
                                        extraData = { ticketKind };
                                    } else if (itemType === 'vehicle') {
                                        // Frontend validation
                                        if (!departureDate || !departureTime || !arrivalDate || !arrivalTime) {
                                            setError('Vui lòng điền đầy đủ ngày giờ');
                                            return;
                                        }

                                        const now = new Date();
                                        const depDate = new Date(departureDate);
                                        const arrDate = new Date(arrivalDate);

                                        if (depDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                                            setError('Ngày khởi hành không được nhỏ hơn ngày hiện tại');
                                            return;
                                        }
                                        if (arrDate < depDate) {
                                            setError('Ngày đến phải lớn hơn hoặc bằng ngày khởi hành');
                                            return;
                                        }

                                        const depDateTime = new Date(`${departureDate}T${departureTime}`);
                                        const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                                        if (depDateTime < twelveHoursLater) {
                                            setError('Giờ khởi hành phải cách hiện tại ít nhất 12 tiếng');
                                            return;
                                        }

                                        if (departureDate === arrivalDate) {
                                            if (arrivalTime <= departureTime) {
                                                setError('Giờ đến phải lớn hơn giờ khởi hành');
                                                return;
                                            }
                                        }

                                        extraData = { phoneNumber: '', codeVehicle: '' }; // Placeholders
                                        attributeData = {
                                            departureDate,
                                            arrivalDate,
                                            departureTime,
                                            arrivalTime,
                                            departurePoint,
                                            arrivalPoint
                                        };
                                    }

                                    createServiceMut.mutate({
                                        providerId: serviceProviderId,
                                        itemType,
                                        title: serviceTitle,
                                        price: servicePrice ? Number(servicePrice) : undefined,
                                        attribute: attributeData,
                                        extraData
                                    });
                                }
                            }}
                            disabled={!serviceProviderId || !serviceTitle || (itemType === 'vehicle' && (!departureDate || !arrivalDate || !departureTime || !arrivalTime)) || createServiceMut.isPending}
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

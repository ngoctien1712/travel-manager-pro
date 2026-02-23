import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerGeographyApi } from '@/api/owner-geography.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Plus, Image as ImageIcon, ArrowLeft, Save, Trash2,
    MapPin, Calendar, Users, Info, Building2, Car, Ticket,
    ExternalLink, X, CheckCircle2, History, Settings, Armchair,
    Clock, PlusCircle, Check, Text
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const COMMON_ROOM_FACILITIES = [
    'WiFi', 'Điều hòa', 'Tivi', 'Tủ lạnh', 'Máy sấy tóc',
    'Bàn làm việc', 'Ban công', 'Bồn tắm', 'Mini Bar'
];

export const ServiceDetail = () => {
    const { idItem } = useParams<{ idItem: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form States
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [extraData, setExtraData] = useState<any>({});
    const [attribute, setAttribute] = useState<any>({});

    // Queries
    const { data: detailData, isLoading, error } = useQuery({
        queryKey: ['owner', 'service-detail', idItem],
        queryFn: () => ownerGeographyApi.getServiceDetail(idItem!),
        enabled: !!idItem,
    });
    const service = detailData?.data;

    useEffect(() => {
        if (service) {
            setTitle(service.title || '');
            setPrice(service.price?.toString() || '');
            setDescription(service.description || '');
            setExtraData({
                guideLanguage: service.guideLanguage || '',
                startAt: service.startAt || '',
                endAt: service.endAt || '',
                address: service.address || '',
                ticketKind: service.ticketKind || '',
                codeVehicle: service.codeVehicle || '',
                maxGuest: service.maxGuest || '',
                maxSlots: service.maxSlots || 0,
                attribute: service.attribute || {} // Store sub-item attributes if needed
            });
            setAttribute(service.attribute || {});
        }
    }, [service]);

    // UI States
    const [posCode, setPosCode] = useState('');
    const [posPrice, setPosPrice] = useState('');
    const [imageFiles, setImageFiles] = useState<FileList | null>(null);

    // Room Dialog States
    const [roomName, setRoomName] = useState('');
    const [roomMaxGuest, setRoomMaxGuest] = useState('2');
    const [roomPrice, setRoomPrice] = useState('');
    const [roomFacilities, setRoomFacilities] = useState<string[]>([]);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [isAddPosOpen, setIsAddPosOpen] = useState(false);

    // Mutations
    const updateMut = useMutation({
        mutationFn: (d: any) => ownerGeographyApi.updateServiceDetail(idItem!, d),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã cập nhật thông tin dịch vụ' });
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể cập nhật dịch vụ', variant: 'destructive' });
        }
    });

    const updateStatusMut = useMutation({
        mutationFn: (status: string) => ownerGeographyApi.updateServiceStatus(idItem!, status),
        onSuccess: (res) => {
            toast({ title: 'Thành công', description: `Trạng thái đã được chuyển sang ${res.status}` });
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể thay đổi trạng thái', variant: 'destructive' });
        }
    });

    const deleteServiceMut = useMutation({
        mutationFn: () => ownerGeographyApi.deleteService(idItem!),
        onSuccess: () => {
            toast({ title: 'Đã xóa', description: 'Dịch vụ đã được gỡ bỏ khỏi hệ thống' });
            navigate('/owner/services');
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể xóa dịch vụ', variant: 'destructive' });
        }
    });

    const uploadMediaMut = useMutation({
        mutationFn: (d: FormData) => ownerGeographyApi.addItemMedia(idItem!, d),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã tải lên hình ảnh mới' });
            setImageFiles(null);
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể tải ảnh lên', variant: 'destructive' });
        }
    });

    const deleteMediaMut = useMutation({
        mutationFn: (idMedia: string) => ownerGeographyApi.deleteItemMedia(idMedia),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã xóa hình ảnh' });
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể xóa hình ảnh', variant: 'destructive' });
        }
    });

    const addPosMut = useMutation({
        mutationFn: (d: { codePosition: string; price: number }) => ownerGeographyApi.addVehiclePosition(idItem!, d),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã thêm vị trí ghế mới' });
            setPosCode('');
            setPosPrice('');
            setIsAddPosOpen(false);
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể thêm vị trí ghế', variant: 'destructive' });
        }
    });

    const deletePosMut = useMutation({
        mutationFn: (id: string) => ownerGeographyApi.deleteVehiclePosition(id),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã xóa vị trí ghế' });
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể xóa vị trí ghế', variant: 'destructive' });
        }
    });

    const addRoomMut = useMutation({
        mutationFn: (d: any) => ownerGeographyApi.addAccommodationRoom(idItem!, d),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã thêm phòng mới' });
            setRoomName('');
            setRoomPrice('');
            setRoomFacilities([]);
            setIsAddRoomOpen(false);
            queryClient.invalidateQueries({ queryKey: ['owner', 'service-detail', idItem] });
        },
        onError: (err: any) => {
            toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể thêm loại phòng', variant: 'destructive' });
        }
    });

    const handleSave = () => {
        const sanitizedExtraData = { ...extraData };
        if (sanitizedExtraData.maxSlots === '' || sanitizedExtraData.maxSlots === undefined) {
            sanitizedExtraData.maxSlots = 0;
        } else {
            sanitizedExtraData.maxSlots = Number(sanitizedExtraData.maxSlots);
        }

        if (sanitizedExtraData.maxGuest === '' || sanitizedExtraData.maxGuest === undefined) {
            sanitizedExtraData.maxGuest = 0;
        } else {
            sanitizedExtraData.maxGuest = Number(sanitizedExtraData.maxGuest);
        }

        updateMut.mutate({
            title,
            price: (price === '' || price === null) ? null : Number(price),
            description,
            attribute,
            extraData: sanitizedExtraData
        });
    };

    const handleUploadImages = () => {
        if (!imageFiles || imageFiles.length === 0) return;
        const formData = new FormData();
        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
        }
        uploadMediaMut.mutate(formData);
    };

    // Attribute Helpers
    const handleArrayAttrChange = (key: string, index: number, value: any) => {
        const arr = [...(attribute[key] || [])];
        arr[index] = value;
        setAttribute({ ...attribute, [key]: arr });
    };

    const addArrayAttr = (key: string, defaultValue: any = '') => {
        const arr = [...(attribute[key] || []), defaultValue];
        setAttribute({ ...attribute, [key]: arr });
    };

    const removeArrayAttr = (key: string, index: number) => {
        const arr = (attribute[key] || []).filter((_: any, i: number) => i !== index);
        setAttribute({ ...attribute, [key]: arr });
    };

    if (isLoading) return (
        <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error || !service) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Không tìm thấy dịch vụ</h2>
            <Button variant="link" onClick={() => navigate('/owner/services')}>Quay lại danh sách</Button>
        </div>
    );

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'tour': return <Calendar className="h-5 w-5" />;
            case 'accommodation': return <Building2 className="h-5 w-5" />;
            case 'vehicle': return <Car className="h-5 w-5" />;
            case 'ticket': return <Ticket className="h-5 w-5" />;
            default: return <Info className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Sticky */}
            <div className="z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 py-4 border-b -mx-6 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/owner/services')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold line-clamp-1">{title || 'Đang chỉnh sửa dịch vụ'}</h1>
                        <p className="text-xs text-muted-foreground flex items-center">
                            {getTypeIcon(service.itemType)}
                            <span className="ml-1 uppercase tracking-tighter opacity-70">{service.itemType}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        className="gradient-sunset border-none shadow-lg shadow-orange-500/20"
                        onClick={handleSave}
                        disabled={updateMut.isPending}
                    >
                        {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                            <TabsTrigger value="details">Cấu hình chi tiết</TabsTrigger>
                            <TabsTrigger value="media">Hình ảnh</TabsTrigger>
                            <TabsTrigger value="settings">Thiết lập</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        <CardTitle>Thông tin cơ bản</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Tên hiển thị</Label>
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên dịch vụ hấp dẫn khách hàng" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Giá gốc (VNĐ)</Label>
                                            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nhà cung cấp</Label>
                                            <Input value={service.providerName} disabled className="bg-muted" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Text className="h-4 w-4 text-muted-foreground" />
                                            <Label>Mô tả dịch vụ</Label>
                                        </div>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Mô tả chi tiết về dịch vụ của bạn để người dùng hiểu rõ hơn..."
                                            className="min-h-[150px] resize-none"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {service.itemType === 'tour' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Thời gian & Quy mô</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Số khách tối đa / đoàn</Label>
                                            <Input type="number" value={extraData.maxSlots} onChange={(e) => setExtraData({ ...extraData, maxSlots: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ngôn ngữ hướng dẫn</Label>
                                            <Input value={extraData.guideLanguage} onChange={(e) => setExtraData({ ...extraData, guideLanguage: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ngày khởi hành</Label>
                                            <Input type="datetime-local" value={extraData.startAt ? new Date(extraData.startAt).toISOString().slice(0, 16) : ''} onChange={(e) => setExtraData({ ...extraData, startAt: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ngày kết thúc</Label>
                                            <Input type="datetime-local" value={extraData.endAt ? new Date(extraData.endAt).toISOString().slice(0, 16) : ''} onChange={(e) => setExtraData({ ...extraData, endAt: e.target.value })} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="details" className="mt-4 space-y-6">
                            {service.itemType === 'tour' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Thông tin Tour bổ sung</CardTitle></CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Kiểu Tour (VD: Daily, Private, Group)</Label>
                                                <Input value={attribute.tourType || ''} onChange={(e) => setAttribute({ ...attribute, tourType: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tiêu chuẩn khách sạn (VD: 3 Sao, 4 Sao)</Label>
                                                <Input value={attribute.hotelStandard || ''} onChange={(e) => setAttribute({ ...attribute, hotelStandard: e.target.value })} />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Điểm đón khách (Departure Point)</Label>
                                                <Input value={attribute.departurePoint || ''} onChange={(e) => setAttribute({ ...attribute, departurePoint: e.target.value })} />
                                            </div>
                                            <div className="col-span-2 grid grid-cols-3 gap-4 border-t pt-4">
                                                <div className="space-y-2">
                                                    <Label>Số bữa sáng</Label>
                                                    <Input type="number" value={attribute.meals?.breakfast || 0} onChange={(e) => setAttribute({ ...attribute, meals: { ...(attribute.meals || {}), breakfast: Number(e.target.value) } })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Số bữa trưa</Label>
                                                    <Input type="number" value={attribute.meals?.lunch || 0} onChange={(e) => setAttribute({ ...attribute, meals: { ...(attribute.meals || {}), lunch: Number(e.target.value) } })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Số bữa tối</Label>
                                                    <Input type="number" value={attribute.meals?.dinner || 0} onChange={(e) => setAttribute({ ...attribute, meals: { ...(attribute.meals || {}), dinner: Number(e.target.value) } })} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Lịch trình chi tiết (Timetable)</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {(attribute.itinerary || []).map((day: any, i: number) => (
                                                <div key={i} className="border p-4 rounded-xl space-y-3 relative group bg-muted/5">
                                                    <div className="flex justify-between items-center">
                                                        <Label className="font-bold text-primary">Ngày {day.day || i + 1}</Label>
                                                        <Button size="icon" variant="ghost" onClick={() => removeArrayAttr('itinerary', i)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                                                    </div>
                                                    <Input placeholder="Tiêu đề ngày (VD: Khám phá Vịnh Hạ Long)" value={day.title || ''} onChange={(e) => {
                                                        const newArr = [...attribute.itinerary];
                                                        newArr[i] = { ...day, title: e.target.value, day: i + 1 };
                                                        setAttribute({ ...attribute, itinerary: newArr });
                                                    }} />
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase">Các hoạt động (mỗi dòng một hoạt động)</Label>
                                                        <Textarea
                                                            placeholder="Ăn sáng tại khách sạn&#10;Di chuyển ra bến tàu&#10;Tham quan hang Sửng Sốt"
                                                            value={day.activities?.join('\n') || ''}
                                                            onChange={(e) => {
                                                                const newArr = [...attribute.itinerary];
                                                                newArr[i] = { ...day, activities: e.target.value.split('\n').filter((a: string) => a.trim() !== '') };
                                                                setAttribute({ ...attribute, itinerary: newArr });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="outline" className="w-full border-dashed" onClick={() => {
                                                const newArr = [...(attribute.itinerary || []), { day: (attribute.itinerary?.length || 0) + 1, title: '', activities: [] }];
                                                setAttribute({ ...attribute, itinerary: newArr });
                                            }}>
                                                <PlusCircle className="h-4 w-4 mr-2" /> Thêm ngày lịch trình
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader><CardTitle>Điểm nổi bật & Tags</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <Label>Điểm nổi bật (Highlights)</Label>
                                                {(attribute.tourHighlights || []).map((h: string, i: number) => (
                                                    <div key={i} className="flex gap-2">
                                                        <Input value={h} onChange={(e) => handleArrayAttrChange('tourHighlights', i, e.target.value)} />
                                                        <Button size="icon" variant="ghost" onClick={() => removeArrayAttr('tourHighlights', i)}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={() => addArrayAttr('tourHighlights')}>+ Thêm điểm nhấn</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {service.itemType === 'accommodation' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Tiện nghi & Xếp hạng</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Loại hình</Label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                        value={extraData.hotelType || 'Khách sạn'}
                                                        onChange={(e) => setExtraData({ ...extraData, hotelType: e.target.value })}
                                                    >
                                                        <option>Khách sạn</option>
                                                        <option>Resort</option>
                                                        <option>Villa</option>
                                                        <option>Homestay</option>
                                                        <option>Apartment</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Số sao (1-5)</Label>
                                                    <Input type="number" min="1" max="5" value={extraData.starRating || extraData.stars || ''} onChange={(e) => setExtraData({ ...extraData, starRating: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Giờ Check-in</Label>
                                                    <Input type="time" value={extraData.checkinTime || '14:00'} onChange={(e) => setExtraData({ ...extraData, checkinTime: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Giờ Check-out</Label>
                                                    <Input type="time" value={extraData.checkoutTime || '12:00'} onChange={(e) => setExtraData({ ...extraData, checkoutTime: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label>Tiện nghi chung (Khách sạn)</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Hồ bơi', 'Gym', 'Spa', 'Nhà hàng', 'Bar', 'Đưa đón sân bay', 'Chỗ đậu xe', 'Thang máy'].map(f => (
                                                        <div key={f} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`acc-amenity-${f}`}
                                                                checked={(attribute.amenities || []).includes(f)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = attribute.amenities || [];
                                                                    if (checked) setAttribute({ ...attribute, amenities: [...current, f] });
                                                                    else setAttribute({ ...attribute, amenities: current.filter((item: string) => item !== f) });
                                                                }}
                                                            />
                                                            <label htmlFor={`acc-amenity-${f}`} className="text-sm cursor-pointer">{f}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label>Hướng tầm nhìn (Views)</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Biển', 'Đồi núi', 'Thành phố', 'Vườn', 'Hồ', 'Bể bơi'].map(v => (
                                                        <div key={v} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`acc-view-${v}`}
                                                                checked={(attribute.views || []).includes(v)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = attribute.views || [];
                                                                    if (checked) setAttribute({ ...attribute, views: [...current, v] });
                                                                    else setAttribute({ ...attribute, views: current.filter((item: string) => item !== v) });
                                                                }}
                                                            />
                                                            <label htmlFor={`acc-view-${v}`} className="text-sm cursor-pointer">{v}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                                <Label className="text-blue-600 font-black uppercase text-[10px] tracking-widest">Chính sách & Quy định</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Chính sách hủy</Label>
                                                        <Input
                                                            value={extraData.policies?.cancellation || 'Linh hoạt'}
                                                            onChange={(e) => setExtraData({
                                                                ...extraData,
                                                                policies: { ...(extraData.policies || {}), cancellation: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Chính sách trẻ em</Label>
                                                        <Input
                                                            value={extraData.policies?.children || 'Cho phép'}
                                                            onChange={(e) => setExtraData({
                                                                ...extraData,
                                                                policies: { ...(extraData.policies || {}), children: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Chính sách thú cưng</Label>
                                                        <Input
                                                            value={extraData.policies?.pets || 'Không cho phép'}
                                                            onChange={(e) => setExtraData({
                                                                ...extraData,
                                                                policies: { ...(extraData.policies || {}), pets: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Mô tả tiện nghi (Tùy chọn)</Label>
                                                <Textarea value={attribute.description || ''} onChange={(e) => setAttribute({ ...attribute, description: e.target.value })} placeholder="VD: Khách sạn có không gian xanh mát, phong cách hiện đại..." />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Quản lý loại phòng</CardTitle></div>
                                            <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                                                <DialogTrigger asChild><Button size="sm" className="gradient-sunset border-none"><Plus className="h-4 w-4 mr-2" /> Thêm loại phòng</Button></DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader><DialogTitle>Thêm phòng mới</DialogTitle></DialogHeader>
                                                    <div className="grid gap-6 py-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2"><Label>Tên loại phòng</Label><Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="VD: Deluxe Suite" /></div>
                                                            <div className="space-y-2"><Label>Số khách tối đa</Label><Input type="number" value={roomMaxGuest} onChange={(e) => setRoomMaxGuest(e.target.value)} /></div>
                                                        </div>
                                                        <div className="space-y-2"><Label>Giá phòng / đêm</Label><Input type="number" value={roomPrice} onChange={(e) => setRoomPrice(e.target.value)} /></div>

                                                        <div className="space-y-3">
                                                            <Label>Tiện ích phòng</Label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {COMMON_ROOM_FACILITIES.map(f => (
                                                                    <div key={f} className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            id={`room-fac-${f}`}
                                                                            checked={roomFacilities.includes(f)}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) setRoomFacilities([...roomFacilities, f]);
                                                                                else setRoomFacilities(roomFacilities.filter(item => item !== f));
                                                                            }}
                                                                        />
                                                                        <label htmlFor={`room-fac-${f}`} className="text-sm font-medium leading-none cursor-pointer">{f}</label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>Hủy</Button>
                                                        <Button className="gradient-sunset border-none" onClick={() => addRoomMut.mutate({ nameRoom: roomName, maxGuest: Number(roomMaxGuest), price: Number(roomPrice), attribute: { facilities: roomFacilities } })}>Tạo phòng</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {service.rooms?.map((room: any) => (
                                                <div key={room.idRoom} className="p-4 border rounded-xl hover:border-primary/50 transition-colors bg-card">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-lg">{room.nameRoom}</h4>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Tối đa {room.maxGuest} người</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-primary font-bold">{room.price?.toLocaleString()} VNĐ</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">mỗi đêm</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {room.attribute?.facilities?.map((f: string) => (
                                                            <Badge key={f} variant="secondary" className="text-[10px] py-0">{f}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!service.rooms || service.rooms.length === 0) && (
                                                <div className="text-center py-6 text-muted-foreground text-sm italic">Chưa có hạng phòng nào. Hãy thêm để khách hàng có thể đặt chỗ.</div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {service.itemType === 'ticket' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Thông tin điểm đến (POI)</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Tên địa danh/Điểm tham quan</Label>
                                                    <Input value={attribute.poiName || ''} onChange={(e) => setAttribute({ ...attribute, poiName: e.target.value })} placeholder="VD: Sun World Bà Nà Hills" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Mức giá (Level)</Label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                        value={attribute.priceLevel || 'Trung bình'}
                                                        onChange={(e) => setAttribute({ ...attribute, priceLevel: e.target.value })}
                                                    >
                                                        <option>Bình dân</option>
                                                        <option>Trung bình</option>
                                                        <option>Cao cấp</option>
                                                        <option>Sang trọng</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Số điểm đánh giá (0-5)</Label>
                                                    <Input type="number" step="0.1" min="0" max="5" value={attribute.rating?.score || 4.8} onChange={(e) => setAttribute({ ...attribute, rating: { ...(attribute.rating || {}), score: Number(e.target.value) } })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Lượt review hiển thị</Label>
                                                    <Input type="number" value={attribute.rating?.reviewsCount || 1000} onChange={(e) => setAttribute({ ...attribute, rating: { ...(attribute.rating || {}), reviewsCount: Number(e.target.value) } })} />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label>Phù hợp với</Label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries({ family: 'Gia đình', kids: 'Trẻ em', seniors: 'Người cao tuổi', couples: 'Cặp đôi' }).map(([k, label]) => (
                                                        <div key={k} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`poi-suit-${k}`}
                                                                checked={attribute.suitability?.[k] || false}
                                                                onCheckedChange={(checked) => {
                                                                    setAttribute({ ...attribute, suitability: { ...(attribute.suitability || {}), [k]: !!checked } });
                                                                }}
                                                            />
                                                            <label htmlFor={`poi-suit-${k}`} className="text-sm cursor-pointer">{label}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                <div className="space-y-2">
                                                    <Label>Thời gian khuyến nghị (Timings)</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Sáng', 'Trưa', 'Chiều', 'Tối'].map(t => (
                                                            <Badge
                                                                key={t}
                                                                variant={(attribute.recommendedTime?.timeOfDay || []).includes(t) ? 'default' : 'outline'}
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    const current = attribute.recommendedTime?.timeOfDay || [];
                                                                    const next = current.includes(t) ? current.filter((i: string) => i !== t) : [...current, t];
                                                                    setAttribute({ ...attribute, recommendedTime: { ...(attribute.recommendedTime || {}), timeOfDay: next } });
                                                                }}
                                                            >
                                                                {t}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Thời lượng tham quan dự kiến (phút)</Label>
                                                    <Input type="number" value={attribute.recommendedTime?.avgDurationMinutes || 120} onChange={(e) => setAttribute({ ...attribute, recommendedTime: { ...(attribute.recommendedTime || {}), avgDurationMinutes: Number(e.target.value) } })} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Độ đông đúc Ngày thường</Label>
                                                    <Input value={attribute.crowdLevel?.weekday || 'Thông thoáng'} onChange={(e) => setAttribute({ ...attribute, crowdLevel: { ...(attribute.crowdLevel || {}), weekday: e.target.value } })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Độ đông đúc Cuối tuần</Label>
                                                    <Input value={attribute.crowdLevel?.weekend || 'Đông đúc'} onChange={(e) => setAttribute({ ...attribute, crowdLevel: { ...(attribute.crowdLevel || {}), weekend: e.target.value } })} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader><CardTitle>Các hoạt động trải nghiệm</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <Label>Danh sách hoạt động</Label>
                                                {(attribute.poiActivities || []).map((a: string, i: number) => (
                                                    <div key={i} className="flex gap-2">
                                                        <Input value={a} onChange={(e) => handleArrayAttrChange('poiActivities', i, e.target.value)} />
                                                        <Button size="icon" variant="ghost" onClick={() => removeArrayAttr('poiActivities', i)}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={() => addArrayAttr('poiActivities')}>+ Thêm hoạt động</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {service.itemType === 'vehicle' && (
                                <div className="space-y-6 mb-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5" /> Lộ trình & Thời gian
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Điểm khởi hành (Pickup Point)</Label>
                                                <Input
                                                    value={attribute.departurePoint || ''}
                                                    onChange={(e) => setAttribute({ ...attribute, departurePoint: e.target.value })}
                                                    placeholder="VD: Bến xe Miền Đông, Văn phòng Quận 1..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Giờ khởi hành (Departure Time)</Label>
                                                <Input
                                                    type="time"
                                                    value={attribute.departureTime || ''}
                                                    onChange={(e) => setAttribute({ ...attribute, departureTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Điểm đến (Drop-off Point)</Label>
                                                <Input
                                                    value={attribute.arrivalPoint || ''}
                                                    onChange={(e) => setAttribute({ ...attribute, arrivalPoint: e.target.value })}
                                                    placeholder="VD: Bến xe Đà Lạt, Văn phòng trung tâm..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Giờ đến dự kiến (Arrival Time)</Label>
                                                <Input
                                                    type="time"
                                                    value={attribute.arrivalTime || ''}
                                                    onChange={(e) => setAttribute({ ...attribute, arrivalTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Thời gian di chuyển dự kiến (VD: 6 tiếng)</Label>
                                                <Input
                                                    value={attribute.estimatedDuration || ''}
                                                    onChange={(e) => setAttribute({ ...attribute, estimatedDuration: e.target.value })}
                                                    placeholder="VD: 6 tiếng 30 phút"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Số lượng chỗ ngồi (Max Seats)</Label>
                                                <Input
                                                    type="number"
                                                    value={extraData.maxGuest || ''}
                                                    onChange={(e) => setExtraData({ ...extraData, maxGuest: e.target.value })}
                                                    placeholder="VD: 40"
                                                />
                                            </div>
                                            <div className="space-y-2 text-xs text-muted-foreground pt-8 italic">
                                                * Thông tin này sẽ hiển thị trực tiếp trên vé và trang tìm kiếm của khách hàng.
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {service.itemType === 'vehicle' && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <div>
                                            <CardTitle className="flex items-center gap-2"><Armchair className="h-5 w-5" /> Sơ đồ ghế ngồi</CardTitle>
                                            <CardDescription>Mô phỏng vị trí các ghế trên phương tiện.</CardDescription>
                                        </div>
                                        <Dialog open={isAddPosOpen} onOpenChange={setIsAddPosOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" className="gradient-sunset border-none"><Plus className="h-4 w-4 mr-2" /> Thêm ghế</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Thêm vị trí mới</DialogTitle></DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Mã ghế (VD: A1, VIP-01)</Label>
                                                        <Input value={posCode} onChange={(e) => setPosCode(e.target.value)} placeholder="Nhập mã ghế duy nhất" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Giá ghế (Mặc định: {price || 0})</Label>
                                                        <Input type="number" value={posPrice} onChange={(e) => setPosPrice(e.target.value)} placeholder="Nếu giá khác với giá cơ bản" />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsAddPosOpen(false)}>Hủy</Button>
                                                    <Button className="gradient-sunset border-none" onClick={() => addPosMut.mutate({ codePosition: posCode, price: Number(posPrice) || Number(price) })}>Lưu vị trí</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-w-md mx-auto bg-muted/10 rounded-3xl border-4 border-muted p-6 relative">
                                            {/* Driver Seat Area */}
                                            <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-dashed">
                                                <div className="w-12 h-14 rounded-lg bg-slate-200 flex items-center justify-center border-2 border-slate-300">
                                                    <div className="w-8 h-8 rounded-full bg-slate-400/20 flex items-center justify-center">
                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-500"></div>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phía trước xe</div>
                                            </div>

                                            {/* Bus Seats Grid */}
                                            <div className="space-y-4">
                                                {/* Group positions by row (A1, A2, B1, B2 -> Row A, Row B) */}
                                                {(() => {
                                                    const rows: Record<string, any[]> = {};
                                                    (service.positions || []).forEach((p: any) => {
                                                        const rowMatch = p.codePosition.match(/^([a-zA-Z]+)/);
                                                        const rowKey = rowMatch ? rowMatch[1] : 'Other';
                                                        if (!rows[rowKey]) rows[rowKey] = [];
                                                        rows[rowKey].push(p);
                                                    });

                                                    return Object.keys(rows).sort().map(rowKey => (
                                                        <div key={rowKey} className="flex justify-between gap-2">
                                                            {/* Left side (2 seats) */}
                                                            <div className="flex gap-2">
                                                                {[0, 1].map(idx => {
                                                                    const p = rows[rowKey].sort((a, b) => a.codePosition.localeCompare(b.codePosition))[idx];
                                                                    return p ? (
                                                                        <div key={p.idPosition} className="relative group">
                                                                            <div className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${p.isBooked ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-inner' : 'bg-white border-muted-foreground/20 hover:border-primary text-muted-foreground shadow-sm'}`}>
                                                                                <Armchair className="h-5 w-5 mb-0.5" />
                                                                                <span className="text-[9px] font-bold">{p.codePosition}</span>
                                                                            </div>
                                                                            {!p.isBooked && (
                                                                                <button onClick={() => deletePosMut.mutate(p.idPosition)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                                    <X className="h-2.5 w-2.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : <div key={`empty-l-${idx}`} className="w-12 h-12 border-2 border-dashed border-muted rounded-lg opacity-20"></div>;
                                                                })}
                                                            </div>

                                                            {/* Aisle */}
                                                            <div className="flex-1 flex items-center justify-center">
                                                                <div className="w-full h-px bg-muted-foreground/10"></div>
                                                            </div>

                                                            {/* Right side (2 seats) */}
                                                            <div className="flex gap-2">
                                                                {[2, 3].map(idx => {
                                                                    const p = rows[rowKey].sort((a, b) => a.codePosition.localeCompare(b.codePosition))[idx];
                                                                    return p ? (
                                                                        <div key={p.idPosition} className="relative group">
                                                                            <div className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${p.isBooked ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-inner' : 'bg-white border-muted-foreground/20 hover:border-primary text-muted-foreground shadow-sm'}`}>
                                                                                <Armchair className="h-5 w-5 mb-0.5" />
                                                                                <span className="text-[9px] font-bold">{p.codePosition}</span>
                                                                            </div>
                                                                            {!p.isBooked && (
                                                                                <button onClick={() => deletePosMut.mutate(p.idPosition)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                                    <X className="h-2.5 w-2.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : <div key={`empty-r-${idx}`} className="w-12 h-12 border-2 border-dashed border-muted rounded-lg opacity-20"></div>;
                                                                })}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>

                                            {/* Rear of bus */}
                                            <div className="mt-8 pt-4 border-t-2 border-dashed text-center">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phía sau xe</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 justify-center mt-8 text-xs font-medium">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div> Còn trống</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></div> Đã đặt</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-dashed border-muted rounded opacity-40"></div> Lối đi / Sẵn sàng</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="media" className="mt-4 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hình ảnh thực tế</CardTitle>
                                    <CardDescription>Cung cấp hình ảnh chất lượng cao để tăng tỷ lệ chuyển đổi khách hàng.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {service.media?.map((m: any, idx: number) => (
                                            <div key={m.idMedia} className="aspect-video relative rounded-lg overflow-hidden border group bg-muted">
                                                <img
                                                    src={m.url.startsWith('http') ? m.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${m.url}`}
                                                    alt="Media"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <button
                                                    onClick={() => deleteMediaMut.mutate(m.idMedia)}
                                                    className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-red-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                {idx === 0 && <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded">Ảnh chính</span>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
                                        <div className="flex justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" /></div>
                                        <div className="max-w-[300px] mx-auto">
                                            <p className="text-sm font-medium">Tải lên ảnh mới</p>
                                            <p className="text-xs text-muted-foreground mb-4">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB/ảnh)</p>
                                            <Input type="file" multiple accept="image/*" className="hidden" id="image-upload" onChange={(e) => setImageFiles(e.target.files)} />
                                            <label htmlFor="image-upload" className="block w-full">
                                                <Button asChild variant="outline" className="w-full cursor-pointer hover:bg-muted/50">
                                                    <span>{imageFiles ? `Đã chọn ${imageFiles.length} ảnh` : 'Chọn ảnh từ máy tính'}</span>
                                                </Button>
                                            </label>
                                        </div>
                                        {imageFiles && (
                                            <Button onClick={handleUploadImages} disabled={uploadMediaMut.isPending} className="w-full max-w-[300px] gradient-sunset border-none">
                                                {uploadMediaMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                Bắt đầu tải lên
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cài đặt hiển thị</CardTitle>
                                    <CardDescription>Quản lý quyền trạng thái của dịch vụ.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border rounded-xl">
                                        <div className="space-y-0.5">
                                            <p className="font-bold flex items-center gap-2">
                                                {service.status === 'active' ? <Badge className="bg-green-500">Đang bán</Badge> : <Badge variant="secondary">Tạm ngưng</Badge>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Thay đổi trạng thái để ẩn/hiện dịch vụ với khách hàng.</p>
                                        </div>
                                        <Button
                                            variant={service.status === 'active' ? 'outline' : 'default'}
                                            onClick={() => updateStatusMut.mutate(service.status === 'active' ? 'inactive' : 'active')}
                                        >
                                            {service.status === 'active' ? 'Ngưng bán' : 'Kích hoạt bán'}
                                        </Button>
                                    </div>

                                    <div className="p-4 border border-red-200 bg-red-50/30 rounded-xl space-y-4">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-red-600">Khu vực nguy hiểm</p>
                                            <p className="text-xs text-muted-foreground">Xóa dịch vụ sẽ xóa toàn bộ dữ liệu liên quan và không thể khôi phục.</p>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" className="w-full md:w-auto">Xóa vĩnh viễn dịch vụ</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Bạn chắc chắn chứ?</DialogTitle></DialogHeader>
                                                <p className="py-4 text-sm text-muted-foreground">Dữ liệu về đặt chỗ, hình ảnh, lịch trình của dịch vụ này sẽ bị mất hoàn toàn.</p>
                                                <DialogFooter>
                                                    <Button variant="destructive" onClick={() => deleteServiceMut.mutate()}>Tôi chắc chắn, hãy xóa nó</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Tóm tắt dịch vụ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Giá thấp nhất</p>
                                <p className="text-xl font-black text-primary italic">
                                    {service.price?.toLocaleString()} <span className="text-sm font-normal not-italic">VNĐ</span>
                                </p>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs uppercase tracking-tighter">Trạng thái</p>
                                    <p className="font-semibold flex items-center gap-1">
                                        {service.status === 'active' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-orange-500" />}
                                        {service.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs uppercase tracking-tighter">Địa phương</p>
                                    <p className="font-semibold line-clamp-1">{service.areaName}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Tiến độ cấu hình</p>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: service.media?.length > 0 ? '80%' : '40%' }}></div>
                                </div>
                                <p className="text-[10px] text-primary font-bold text-center">Cơ bản hoàn tất</p>
                            </div>
                            <Button variant="outline" className="w-full group" asChild>
                                <a href={`/services/${idItem}`} target="_blank" rel="noreferrer">
                                    Trang hiển thị khách <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Gợi ý từ Traveloka</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                            <div className="flex gap-2">
                                <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                                <p>Cung cấp lịch trình rõ ràng giúp khách hàng an tâm đặt tour hơn 30%.</p>
                            </div>
                            <div className="flex gap-2">
                                <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                                <p>Nên có ít nhất 5 ảnh thực tế (không phải ảnh stock) để tăng uy tín.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetail;

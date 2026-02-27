import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { customerApi } from '@/api/customer.api';
import { MapPin, Calendar, Users, ChevronLeft, ChevronRight, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';

export default function BookingPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Form, 2: Review
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState<any>({
        bookingDate: '',
        checkInDate: '',
        checkOutDate: '',
        quantity: 1,
        id_room: null,
        id_trip: null,
        selectedSeats: [],
        guestInfo: {
            fullName: '',
            email: '',
            phone: ''
        },
        paymentMethod: 'bank'
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q_quantity = params.get('quantity');
        const q_room = params.get('id_room');
        const q_trip = params.get('id_trip');
        const q_seats = params.get('seats');
        const q_date = params.get('booking_date');

        setFormData(prev => ({
            ...prev,
            quantity: q_quantity ? Number(q_quantity) : 1,
            id_room: q_room,
            id_trip: q_trip,
            selectedSeats: q_seats ? q_seats.split(',') : [],
            bookingDate: q_date || '',
            checkInDate: q_date || '', // Default for hotel if single date passed
        }));
    }, []);

    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                const data = await customerApi.getServiceDetail(id!);
                setService(data);
                setError(null);
            } catch (err) {
                setError('Không tìm thấy thông tin dịch vụ');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchService();
    }, [id]);

    const handleNext = () => {
        // Basic validation
        if (service.item_type === 'tour' || service.item_type === 'ticket') {
            if (!formData.bookingDate) return alert('Vui lòng chọn ngày');
        }
        if (service.item_type === 'accommodation') {
            if (!formData.checkInDate || !formData.checkOutDate) return alert('Vui lòng chọn ngày nhận/trả phòng');
        }
        if (!formData.guestInfo.fullName || !formData.guestInfo.phone) return alert('Vui lòng điền thông tin liên hệ');

        setStep(2);
        window.scrollTo(0, 0);
    };

    const getEffectivePrice = () => {
        if (!service) return 0;
        if (service.item_type === 'accommodation' && formData.id_room) {
            const room = service.rooms?.find((r: any) => String(r.id_room || r.idRoom) === String(formData.id_room));
            return room?.price || service.price || 0;
        }
        if (service.item_type === 'vehicle' && formData.id_trip) {
            const trip = service.trips?.find((t: any) => String(t.id_trip || t.idTrip) === String(formData.id_trip));
            return Number(trip?.price_override) || Number(service.price) || 0;
        }
        return Number(service.price) || 0;
    };

    const calculateTotal = () => {
        const price = getEffectivePrice();
        if (service?.item_type === 'vehicle' && formData.selectedSeats?.length > 0) {
            return price * formData.selectedSeats.length;
        }

        let total = price * (formData.quantity || 1);

        if (service?.item_type === 'accommodation' && formData.checkInDate && formData.checkOutDate) {
            const start = new Date(formData.checkInDate);
            const end = new Date(formData.checkOutDate);
            const diff = end.getTime() - start.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            total = price * (formData.quantity || 1) * (days > 0 ? days : 1);
        }

        return total;
    };

    const handleSubmit = async () => {
        try {
            let details: any = {};

            if (service.item_type === 'tour') {
                details = { quantity: formData.quantity, booking_date: formData.bookingDate, guest_info: formData.guestInfo };
            } else if (service.item_type === 'accommodation') {
                details = {
                    id_room: formData.id_room || service.rooms?.[0]?.id_room,
                    start_date: formData.checkInDate,
                    end_date: formData.checkOutDate,
                    quantity: formData.quantity,
                    guest_info: formData.guestInfo
                };
            } else if (service.item_type === 'ticket') {
                details = { visit_date: formData.bookingDate, quantity: formData.quantity, guest_info: formData.guestInfo };
            } else if (service.item_type === 'vehicle') {
                details = {
                    id_trip: formData.id_trip,
                    seats: formData.selectedSeats,
                    guest_info: formData.guestInfo,
                    quantity: formData.selectedSeats.length || formData.quantity
                };
            }

            const result = await customerApi.createBooking({
                id_item: service.id_item,
                item_type: service.item_type,
                payment_method: formData.paymentMethod,
                details
            });

            if (result.success) {
                navigate(`/my-orders/${result.id_order}`);
            }
        } catch (error) {
            alert('Đã có lỗi xảy ra khi tạo đơn hàng');
        }
    };

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return 'https://images.unsplash.com/photo-1544225058-c98af409584b?w=800';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${backendUrl}${cleanUrl}`;
    };

    if (loading) return <LoadingSkeleton />;
    if (error || !service) return <ErrorState message={error || 'Lỗi kết nối'} />;

    return (
        <div className="min-h-screen bg-[#F7F9FA] pb-24">
            {/* Header Process */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="container max-w-6xl px-4 h-20 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="font-black gap-2 text-gray-400 hover:text-blue-600">
                        <ChevronLeft size={20} /> QUAY LẠI
                    </Button>

                    <div className="flex items-center gap-1">
                        <div className={`flex items-center gap-3 px-6 py-2 rounded-full transition-all ${step === 1 ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${step === 1 ? 'border-blue-600 bg-white' : 'border-gray-200'}`}>1</div>
                            <span className="text-xs font-black uppercase tracking-[0.15em] hidden sm:inline">Thông tin đặt chỗ</span>
                        </div>
                        <div className="w-10 h-[2px] bg-gray-100 mx-2" />
                        <div className={`flex items-center gap-3 px-6 py-2 rounded-full transition-all ${step === 2 ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${step === 2 ? 'border-blue-600 bg-white' : 'border-gray-200'}`}>2</div>
                            <span className="text-xs font-black uppercase tracking-[0.15em] hidden sm:inline">Xác nhận & Thanh toán</span>
                        </div>
                    </div>

                    <div className="w-32 hidden md:block" />
                </div>
            </div>

            <div className="container max-w-6xl px-4 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {step === 1 ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                {/* Form Section */}
                                <Card className="p-10 rounded-[2.5rem] border-none shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] bg-white space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                                            <Calendar size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Chi tiết hành trình</h2>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Chọn thời gian và quy mô chuyến đi</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {(service.item_type === 'tour' || service.item_type === 'ticket') && (
                                            <div className="space-y-3 col-span-full">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                                                    {service.item_type === 'tour' ? 'Ngày khởi hành mong muốn' : 'Ngày sử dụng dịch vụ'}
                                                </label>
                                                <div className="relative group">
                                                    <Input
                                                        type="date"
                                                        className="h-16 rounded-2xl bg-gray-50 border-transparent font-black text-lg focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all pl-14 shadow-sm"
                                                        value={formData.bookingDate}
                                                        onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                                                    />
                                                    <Calendar className="absolute left-5 top-5 text-blue-500 group-hover:scale-110 transition-transform" size={24} />
                                                </div>
                                            </div>
                                        )}

                                        {service.item_type === 'accommodation' && (
                                            <>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Ngày nhận phòng</label>
                                                    <div className="relative group">
                                                        <Input
                                                            type="date"
                                                            className="h-16 rounded-2xl bg-gray-50 border-transparent font-black text-lg focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all pl-14 shadow-sm"
                                                            value={formData.checkInDate}
                                                            onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                                                        />
                                                        <Calendar className="absolute left-5 top-5 text-blue-500" size={24} />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Ngày trả phòng</label>
                                                    <div className="relative group">
                                                        <Input
                                                            type="date"
                                                            className="h-16 rounded-2xl bg-gray-50 border-transparent font-black text-lg focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all pl-14 shadow-sm"
                                                            value={formData.checkOutDate}
                                                            onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                                                        />
                                                        <Calendar className="absolute left-5 top-5 text-blue-500" size={24} />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {service.item_type !== 'vehicle' && (
                                            <div className="space-y-4 col-span-full">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center block">
                                                    Số lượng {service.item_type === 'accommodation' ? 'phòng đặt' : 'khách tham gia'}
                                                </label>
                                                <div className="flex items-center gap-6 bg-gray-50 p-3 rounded-3xl border border-gray-100 max-w-sm mx-auto shadow-inner">
                                                    <button
                                                        onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                                                        className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center font-black text-2xl hover:bg-gray-900 hover:text-white transition-all active:scale-90"
                                                    >-</button>
                                                    <div className="flex-1 text-center font-black text-3xl text-gray-900">{formData.quantity}</div>
                                                    <button
                                                        onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                                                        className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center font-black text-2xl hover:bg-gray-900 hover:text-white transition-all active:scale-90"
                                                    >+</button>
                                                </div>
                                            </div>
                                        )}

                                        {service.item_type === 'vehicle' && (
                                            <div className="col-span-full p-8 rounded-[2rem] bg-blue-50/50 border border-blue-100 flex items-center justify-between group shadow-sm">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Thông tin phương tiện</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-gray-900 text-lg">Đã chọn {formData.selectedSeats?.length || 0} chỗ</span>
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formData.selectedSeats?.join(', ')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl border-blue-200 text-blue-600 font-black hover:bg-blue-600 hover:text-white transition-all">THAY ĐỔI</Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-10 rounded-[2.5rem] border-none shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] bg-white space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                                            <Users size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Thông tin liên lạc</h2>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Chúng tôi sẽ gửi vé điện tử qua thông tin này</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3 col-span-full">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Họ và tên khách hàng</label>
                                            <Input
                                                placeholder="VD: NGUYEN VAN A"
                                                className="h-16 rounded-2xl bg-gray-50 border-transparent font-black text-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all px-6 shadow-sm uppercase placeholder:text-gray-300"
                                                value={formData.guestInfo.fullName}
                                                onChange={(e) => setFormData({ ...formData, guestInfo: { ...formData.guestInfo, fullName: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Số điện thoại</label>
                                            <Input
                                                placeholder="09xx xxx xxx"
                                                className="h-16 rounded-2xl bg-gray-50 border-transparent font-black text-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all px-6 shadow-sm placeholder:text-gray-300"
                                                value={formData.guestInfo.phone}
                                                onChange={(e) => setFormData({ ...formData, guestInfo: { ...formData.guestInfo, phone: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Email (Tùy chọn)</label>
                                            <Input
                                                placeholder="example@gmail.com"
                                                className="h-16 rounded-2xl bg-gray-50 border-transparent font-black text-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all px-6 shadow-sm placeholder:text-gray-300"
                                                value={formData.guestInfo.email}
                                                onChange={(e) => setFormData({ ...formData, guestInfo: { ...formData.guestInfo, email: e.target.value } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-3 text-emerald-600">
                                            <ShieldCheck size={24} className="animate-pulse" />
                                            <p className="text-xs font-black uppercase tracking-widest">Dữ liệu được bảo mật 100%</p>
                                        </div>
                                        <Button
                                            onClick={handleNext}
                                            className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-[0.98] w-full md:w-auto"
                                        >
                                            TIẾP TỤC XÁC NHẬN <ChevronRight className="ml-2" />
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                                <Card className="p-10 rounded-[2.5rem] border-none shadow-xl bg-white space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center text-orange-600">
                                            <CreditCard size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Xác nhận đơn hàng</h2>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Kiểm tra lại và hoàn tất đơn hàng</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian hành trình</p>
                                                <p className="font-black text-gray-900 text-lg">
                                                    {service.item_type === 'accommodation'
                                                        ? `${formData.checkInDate} → ${formData.checkOutDate}`
                                                        : formData.bookingDate || 'Chưa chọn'}
                                                </p>
                                            </div>
                                            <div className="space-y-1 md:text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chi tiết số lượng</p>
                                                <p className="font-black text-gray-900 text-lg">
                                                    {service.item_type === 'vehicle'
                                                        ? `${formData.selectedSeats?.length || 0} Ghế (${formData.selectedSeats?.join(', ')})`
                                                        : `x${formData.quantity} ${service.item_type === 'accommodation' ? 'Phòng' : 'Khách'}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[2rem] border-2 border-dashed border-gray-200 space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Người đại diện đặt chỗ</p>
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <p className="font-black text-gray-900 text-xl uppercase tracking-tight">{formData.guestInfo.fullName}</p>
                                                <p className="font-bold text-gray-500">{formData.guestInfo.phone} • {formData.guestInfo.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-100">
                                        <div className="flex items-center gap-4 mb-6">
                                            <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase px-4 py-1 rounded-full">BƯỚC CUỐI</Badge>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tight">Phương thức thanh toán</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button
                                                onClick={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                                                className={`p-8 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${formData.paymentMethod === 'bank' ? 'border-blue-600 bg-blue-50/50 shadow-lg' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                                            >
                                                <div className="relative z-10">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.paymentMethod === 'bank' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <CreditCard size={24} />
                                                    </div>
                                                    <h4 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Chuyển khoản / VietQR</h4>
                                                    <p className="text-xs font-bold text-gray-400 mt-1">Xác nhận tự động trong 1-3 phút</p>
                                                </div>
                                                {formData.paymentMethod === 'bank' && <CheckCircle2 className="absolute top-6 right-6 text-blue-600 animate-in zoom-in duration-300" size={24} />}
                                            </button>

                                            <button
                                                onClick={() => setFormData({ ...formData, paymentMethod: 'momo' })}
                                                className={`p-8 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group opacity-50 cursor-not-allowed ${formData.paymentMethod === 'momo' ? 'border-pink-600 bg-pink-50/50 shadow-lg' : 'border-gray-100 bg-white'}`}
                                            >
                                                <div className="relative z-10">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.paymentMethod === 'momo' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <span className="font-black text-[10px]">MOMO</span>
                                                    </div>
                                                    <h4 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Ví điện tử MoMo</h4>
                                                    <p className="text-xs font-bold text-gray-400 mt-1">Đang bảo trì hệ thống</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
                                <div className="h-48 relative">
                                    <img src={getImageUrl(service.thumbnail)} className="w-full h-full object-cover" alt={service.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <Badge className="bg-blue-600 mb-2 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 text-white">
                                            {service.item_type === 'accommodation' ? 'KHÁCH SẠN' : service.item_type === 'vehicle' ? 'VẬN CHUYỂN' : 'DỊCH VỤ'}
                                        </Badge>
                                        <h3 className="text-white font-black text-lg line-clamp-1 leading-tight tracking-tight uppercase italic">{service.title}</h3>
                                    </div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                            <span>Đơn giá</span>
                                            <span className="text-gray-900">{getEffectivePrice().toLocaleString()}đ</span>
                                        </div>
                                        {service.item_type === 'vehicle' ? (
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                                <span>Số ghế ({formData.selectedSeats?.length || 0})</span>
                                                <span className="text-gray-900">{formData.selectedSeats?.join(', ')}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                                <span>Số lượng</span>
                                                <span className="text-gray-900">x{formData.quantity}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-gray-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tổng phí</span>
                                            <span className="text-2xl font-black text-blue-600 tracking-tighter">{calculateTotal().toLocaleString()}đ</span>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-gray-50 space-y-3">
                                        <div className="flex items-start gap-4">
                                            <MapPin size={18} className="text-blue-500 shrink-0 mt-1" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Điểm đến / Vị trí</p>
                                                <p className="text-xs font-black text-gray-700 leading-tight">{service.address || service.city_name || 'Việt Nam'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <Calendar size={18} className="text-blue-500 shrink-0 mt-1" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Thời gian hành trình</p>
                                                <p className="text-xs font-black text-gray-700 leading-tight">
                                                    {service.item_type === 'accommodation'
                                                        ? `${formData.checkInDate || '---'} đến ${formData.checkOutDate || '---'}`
                                                        : formData.bookingDate || 'Chưa chọn'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {step === 1 ? (
                                <Button
                                    onClick={handleNext}
                                    className="w-full h-20 rounded-[2rem] bg-gray-900 hover:bg-black text-white font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 group"
                                >
                                    <span>TIẾP TỤC</span>
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group"
                                >
                                    <span>ĐẶT CHỖ NGAY</span>
                                    <CheckCircle2 className="group-hover:rotate-12 transition-transform" />
                                </Button>
                            )}

                            <div className="p-8 rounded-[2rem] bg-white border border-gray-100 text-center space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Hỗ trợ dịch vụ 24/7</p>
                                <p className="text-2xl font-black text-gray-900 tracking-tighter">1900 1234</p>
                                <div className="h-1 w-12 bg-blue-100 mx-auto rounded-full" />
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">Hãy liên hệ nếu bạn cần trợ giúp về quy trình đặt phòng hoặc thanh toán.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

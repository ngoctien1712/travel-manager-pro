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
        guestInfo: {
            fullName: '',
            email: '',
            phone: ''
        },
        paymentMethod: 'bank'
    });

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
        if (service.item_type === 'accommodation' && service.rooms?.length > 0) {
            return service.rooms[0].price;
        }
        return service.price || 0;
    };

    const calculateTotal = () => {
        const price = getEffectivePrice();
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
                    id_room: service.rooms?.[0]?.id_room,
                    start_date: formData.checkInDate,
                    end_date: formData.checkOutDate,
                    quantity: formData.quantity,
                    guest_info: formData.guestInfo
                };
            } else if (service.item_type === 'ticket') {
                details = { visit_date: formData.bookingDate, quantity: formData.quantity, guest_info: formData.guestInfo };
            } else if (service.item_type === 'vehicle') {
                details = {
                    id_position: service.seats?.[0]?.id_position,
                    from: service.departure_time,
                    to: service.arrival_time,
                    guest_info: formData.guestInfo,
                    quantity: formData.quantity
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

    if (loading) return <LoadingSkeleton />;
    if (error || !service) return <ErrorState message={error || 'Lỗi kết nối'} />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header Process */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container max-w-4xl px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="font-bold gap-2">
                        <ChevronLeft size={18} /> Quay lại
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>1</div>
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Thông tin</span>
                        </div>
                        <div className="w-8 h-[2px] bg-gray-100" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>2</div>
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Xác nhận</span>
                        </div>
                    </div>
                    <div className="w-20" /> {/* Spacer */}
                </div>
            </div>

            <div className="container max-w-4xl px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Main Column */}
                    <div className="md:col-span-8 space-y-6">
                        {step === 1 ? (
                            <>
                                {/* Form Section */}
                                <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 leading-tight">Thời gian & Số lượng</h2>
                                            <p className="text-xs font-bold text-gray-400">Vui lòng chọn lịch trình của bạn</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {(service.item_type === 'tour' || service.item_type === 'ticket') && (
                                            <div className="space-y-3 col-span-full">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                    {service.item_type === 'tour' ? 'Ngày khởi hành' : 'Ngày tham quan'}
                                                </label>
                                                <Input
                                                    type="date"
                                                    className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                                                    value={formData.bookingDate}
                                                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {service.item_type === 'accommodation' && (
                                            <>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nhận phòng</label>
                                                    <Input
                                                        type="date"
                                                        className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                                                        value={formData.checkInDate}
                                                        onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trả phòng</label>
                                                    <Input
                                                        type="date"
                                                        className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                                                        value={formData.checkOutDate}
                                                        onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="space-y-3 col-span-full">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">
                                                Số lượng {service.item_type === 'accommodation' ? 'phòng' : 'khách'}
                                            </label>
                                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                                <button
                                                    onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                                                    className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center font-black hover:bg-gray-900 hover:text-white transition-all"
                                                >-</button>
                                                <div className="flex-1 text-center font-black text-xl">{formData.quantity}</div>
                                                <button
                                                    onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                                                    className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center font-black hover:bg-gray-900 hover:text-white transition-all"
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 leading-tight">Người liên hệ</h2>
                                            <p className="text-xs font-bold text-gray-400">Thông tin để nhận vé và xác nhận</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                            <Input
                                                placeholder="Nguyễn Văn A"
                                                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                                                value={formData.guestInfo.fullName}
                                                onChange={(e) => setFormData({ ...formData, guestInfo: { ...formData.guestInfo, fullName: e.target.value } })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                                <Input
                                                    placeholder="0901234567"
                                                    className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                                                    value={formData.guestInfo.phone}
                                                    onChange={(e) => setFormData({ ...formData, guestInfo: { ...formData.guestInfo, phone: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                                <Input
                                                    placeholder="example@gmail.com"
                                                    className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                                                    value={formData.guestInfo.email}
                                                    onChange={(e) => setFormData({ ...formData, guestInfo: { ...formData.guestInfo, email: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <CreditCard size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 leading-tight">Phương thức thanh toán</h2>
                                            <p className="text-xs font-bold text-gray-400">Chọn cách bạn muốn thanh toán</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col gap-3 ${formData.paymentMethod === 'bank' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 bg-gray-50'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wide">Ngân hàng (QR)</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase text-blue-500">Tự động xác nhận</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'momo' })}
                                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col gap-3 opacity-50 ${formData.paymentMethod === 'momo' ? 'border-pink-600 bg-pink-50/50' : 'border-gray-100 bg-gray-50'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-pink-600">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wide">Ví MoMo</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Tạm bảo trì</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            /* Review Step */
                            <Card className="p-10 rounded-[2.5rem] border-none shadow-sm space-y-10 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8">
                                    <ShieldCheck size={64} className="text-emerald-50 opacity-10 absolute -top-4 -right-4" />
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase px-4 py-2">Sẵn sàng đặt chỗ</Badge>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Kiểm tra thông tin</h2>
                                    <p className="text-sm font-bold text-gray-400 italic">Vui lòng rà soát kỹ các thông tin trước khi xác nhận thanh toán</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Dịch vụ</p>
                                            <p className="font-black text-gray-900">{service.title}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Loại</p>
                                            <Badge variant="outline" className="border-gray-100 text-gray-500 font-bold uppercase text-[9px]">{service.item_type}</Badge>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thời gian</p>
                                            <p className="font-bold text-gray-700">
                                                {service.item_type === 'accommodation'
                                                    ? `${formData.checkInDate} → ${formData.checkOutDate}`
                                                    : formData.bookingDate
                                                }
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                                            <p className="font-bold text-gray-700">{formData.quantity} {service.item_type === 'accommodation' ? 'phòng' : 'khách'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Khách hàng</p>
                                        <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-gray-100">
                                            <div>
                                                <p className="font-black text-gray-900">{formData.guestInfo.fullName}</p>
                                                <p className="text-xs font-bold text-gray-400">{formData.guestInfo.phone} • {formData.guestInfo.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng cộng hóa đơn</p>
                                            <p className="text-4xl font-black text-blue-600 tracking-tighter">{calculateTotal().toLocaleString()}đ</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase">Ưu đãi miễn phí hủy</p>
                                            <p className="text-[9px] font-black text-blue-400 uppercase">Xác nhận tức thì</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="md:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <Card className="overflow-hidden rounded-[2rem] border-none shadow-sm">
                                <img src={service.thumbnail} className="w-full h-40 object-cover" />
                                <div className="p-6 space-y-4">
                                    <h3 className="font-black text-lg text-gray-900 leading-tight">{service.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <MapPin size={14} />
                                        <span className="text-xs font-bold">{service.city_name}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đơn giá</span>
                                        <span className="font-black text-blue-600">{getEffectivePrice().toLocaleString()}đ</span>
                                    </div>
                                </div>
                            </Card>

                            {step === 1 ? (
                                <Button
                                    onClick={handleNext}
                                    className="w-full h-16 rounded-[1.5rem] bg-gray-900 hover:bg-black text-white font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    TIẾP TỤC <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                                >
                                    XÁC NHẬN & THANH TOÁN <CheckCircle2 size={20} />
                                </Button>
                            )}

                            <div className="px-6 space-y-4">
                                <div className="flex items-center gap-3 text-emerald-600">
                                    <ShieldCheck size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Thanh toán bảo mật</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                    Bằng việc nhấp vào xác nhận, bạn đồng ý với các Điều khoản & Chính sách của VietTravel.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

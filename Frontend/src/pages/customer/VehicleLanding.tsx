import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { customerApi } from '@/api/customer.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bus, MapPin, Calendar, Users, ArrowRightLeft, ShieldCheck, Clock, Zap, Repeat, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';
import { ServiceCardSkeleton } from '@/components/LoadingSkeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const VehicleLanding = () => {
    const navigate = useNavigate();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [isRoundTrip, setIsRoundTrip] = useState(false);

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    const { data, isLoading } = useQuery({
        queryKey: ['listVehicles', from, to],
        queryFn: () => customerApi.listServices({ type: 'vehicle', city: to, q: from }),
    });

    const handleSearch = () => {
        // Navigate to a specific search results page if needed, for now just shows below
        console.log('Searching for vehicles...', { from, to, isRoundTrip });
    };

    return (
        <div className="bg-[#F7F9FA] min-h-screen pb-20">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920')] bg-cover bg-center"
                />
                <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-[1px]" />

                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-xl tracking-tight">
                        Vé xe khách & Tuyến đường dài
                    </h1>
                    <p className="text-lg opacity-90 font-medium drop-shadow-md">
                        Tìm kiếm hàng ngàn chuyến xe mỗi ngày với giá cực ưu đãi
                    </p>
                </div>
            </section>

            {/* Search Box - Specific for Vehicles/Bus */}
            <div className="container max-w-6xl relative z-20 -mt-24 px-4">
                <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Switch id="round-trip" checked={isRoundTrip} onCheckedChange={setIsRoundTrip} className="data-[state=checked]:bg-blue-600" />
                                <Label htmlFor="round-trip" className="font-black text-gray-500 uppercase text-[10px] tracking-widest cursor-pointer">Khứ hồi</Label>
                            </div>
                            <div className="flex items-center gap-2 opacity-30">
                                <Switch id="booking-for-others" disabled className="data-[state=checked]:bg-blue-600" />
                                <Label htmlFor="booking-for-others" className="font-black text-gray-500 uppercase text-[10px] tracking-widest">Đặt cho người khác</Label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-6 items-end">
                            <div className="lg:col-span-3 space-y-2 relative">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ (Điểm đón)</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        placeholder="Tỉnh, thành phố, bến xe..."
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="hidden lg:flex lg:col-span-1 justify-center items-center pb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer rotate-90 lg:rotate-0">
                                    <Repeat size={16} />
                                </div>
                            </div>

                            <div className="lg:col-span-3 space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Đến (Điểm trả)</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        placeholder="Tỉnh, thành phố, bến xe..."
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày đi</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        type="text"
                                        placeholder="27 Th02"
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-1 space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Giờ</label>
                                <div className="relative group">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                    <select className="pl-9 h-14 w-full bg-gray-50 border-gray-100 rounded-2xl focus:ring-blue-600 font-bold text-xs appearance-none cursor-pointer">
                                        <option>08:00</option>
                                        <option>12:00</option>
                                        <option>18:00</option>
                                        <option>22:00</option>
                                    </select>
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <Button onClick={handleSearch} className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-[0.98]">
                                    <Search className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Benefits */}
            <section className="container max-w-6xl py-12 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white shadow-sm border border-gray-50">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={32} />
                        </div>
                        <h4 className="font-bold text-gray-900 leading-tight">Bảo hiểm hành trình</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Luôn có bảo hiểm kèm theo mỗi lượt vé đặt tại VietTravel</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white shadow-sm border border-gray-50">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <Clock size={32} />
                        </div>
                        <h4 className="font-bold text-gray-900 leading-tight">Phục vụ 24/7</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Hỗ trợ khách hàng mọi lúc, kể cả các khung giờ khuya</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white shadow-sm border border-gray-50">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Zap size={32} />
                        </div>
                        <h4 className="font-bold text-gray-900 leading-tight">Vé điện tử</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Không cần in vé, chỉ cần mã QR trên điện thoại</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white shadow-sm border border-gray-50">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Users size={32} />
                        </div>
                        <h4 className="font-bold text-gray-900 leading-tight">Yên tâm tuyệt đối</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Đơn vị vận chuyển được kiểm định chất lượng định kỳ</p>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="container max-w-6xl py-10 px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Bus className="text-blue-600" /> Tuyến xe phổ biến
                    </h2>
                    <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl">Xem tất cả</Button>
                </div>

                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-[2rem]" />)
                    ) : (
                        data?.items.map((vehicle: any) => (
                            <Link key={vehicle.id_item} to={`/services/${vehicle.id_item}`} className="group">
                                <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white group-hover:-translate-y-1">
                                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-50">
                                        {/* Left: Provider Info */}
                                        <div className="p-8 md:w-1/4 flex flex-col justify-center items-center text-center gap-3">
                                            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden shadow-inner">
                                                {vehicle.thumbnail ? (
                                                    <img src={getImageUrl(vehicle.thumbnail)!} alt={vehicle.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Bus size={32} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 leading-tight">{vehicle.title}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                    {vehicle.max_guest || vehicle.attribute?.maxGuest || 45} chỗ • {(vehicle.attribute?.facilities || []).slice(0, 2).join(', ') || 'Ghế ngả'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Center: Timeline */}
                                        <div className="p-8 flex-1 flex items-center justify-between gap-8 px-12">
                                            <div className="text-left w-24">
                                                <p className="text-2xl font-black text-gray-900">{vehicle.departure_time || vehicle.attribute?.departureTime || '08:00'}</p>
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mt-1 line-clamp-1">{vehicle.attribute?.departurePoint || from || 'Hà Nội'}</p>
                                            </div>

                                            <div className="flex-1 flex flex-col items-center gap-2 relative">
                                                <p className="text-[10px] font-black text-gray-400">{vehicle.attribute?.estimatedDuration || '4 tiếng'}</p>
                                                <div className="w-full h-px bg-gray-200 relative">
                                                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-blue-500 bg-white" />
                                                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
                                                </div>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase">Trực tiếp</p>
                                            </div>

                                            <div className="text-right w-24">
                                                <p className="text-2xl font-black text-gray-900">{vehicle.arrival_time || vehicle.attribute?.arrivalTime || '12:00'}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1 line-clamp-1">{vehicle.attribute?.arrivalPoint || vehicle.city_name || 'Đà Nẵng'}</p>
                                            </div>
                                        </div>

                                        {/* Right: Price & CTA */}
                                        <div className="p-8 md:w-1/4 flex flex-col justify-center items-center md:items-end gap-4 bg-gray-50/30">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-orange-500 uppercase mb-1">Giá mỗi khách</p>
                                                <p className="text-3xl font-black text-blue-600 tracking-tighter">{formatCurrency(vehicle.price)}</p>
                                            </div>
                                            <Button className="w-full md:w-auto px-8 h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-100 transition-all">
                                                Chọn tuyến
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default VehicleLanding;

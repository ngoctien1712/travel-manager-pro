import { useState, useEffect } from 'react';
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

import { geographyApi } from '@/api/geography.api';

export const VehicleLanding = () => {
    const navigate = useNavigate();
    const [fromProvinceId, setFromProvinceId] = useState('');
    const [toProvinceId, setToProvinceId] = useState('');
    const [provinces, setProvinces] = useState<any[]>([]);
    const [isRoundTrip, setIsRoundTrip] = useState(false);

    // Search Filters
    const [departureDate, setDepartureDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [departureTime, setDepartureTime] = useState('08:00');
    const [returnTime, setReturnTime] = useState('18:00');

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    // Fetch Provinces
    useEffect(() => {
        geographyApi.listCountries().then(res => {
            const vn = res.data.find((c: any) => c.code === 'VN' || c.name === 'Vietnam');
            const countryId = vn?.id || res.data[0]?.id;
            if (countryId) {
                geographyApi.listCities(countryId).then(cityRes => {
                    setProvinces(cityRes.data);
                });
            }
        });
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ['listVehicles', fromProvinceId, toProvinceId, departureDate, returnDate, departureTime, returnTime, isRoundTrip],
        queryFn: () => customerApi.listServices({
            type: 'vehicle',
            provinceId: fromProvinceId,
            arrivalProvinceId: toProvinceId,
            departureDate,
            returnDate: isRoundTrip ? returnDate : undefined,
            // Assuming the API can handle these or we'll update it later
        }),
    });

    const handleSearch = () => {
        if (!fromProvinceId || !toProvinceId) {
            alert('Vui lòng chọn điểm đi và điểm đến');
            return;
        }
        if (!departureDate) {
            alert('Vui lòng chọn ngày đi');
            return;
        }
        if (isRoundTrip && !returnDate) {
            alert('Vui lòng chọn ngày về cho chuyến khứ hồi');
            return;
        }

        console.log('Searching for vehicles...', {
            fromProvinceId,
            toProvinceId,
            departureDate,
            returnDate: isRoundTrip ? returnDate : null,
            departureTime,
            isRoundTrip
        });
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
                        {/* Type Selection */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setIsRoundTrip(false)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${!isRoundTrip ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                Một chiều
                            </button>
                            <button
                                onClick={() => setIsRoundTrip(true)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isRoundTrip ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                Khứ hồi
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Row 1: Origins & Destinations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-4 items-center">
                                <div className="lg:col-span-4 space-y-2 relative">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Điểm đi</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                        <select
                                            className="w-full h-14 pl-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                            value={fromProvinceId}
                                            onChange={(e) => setFromProvinceId(e.target.value)}
                                        >
                                            <option value="">Thành phố đi</option>
                                            {provinces.map(p => <option key={p.id} value={p.id}>{p.nameVi || p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
                                    <div
                                        className="w-12 h-12 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-blue-600 hover:text-white hover:bg-blue-600 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                                        onClick={() => {
                                            const temp = fromProvinceId;
                                            setFromProvinceId(toProvinceId);
                                            setToProvinceId(temp);
                                        }}
                                    >
                                        <Repeat size={20} />
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Điểm đến</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                        <select
                                            className="w-full h-14 pl-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                            value={toProvinceId}
                                            onChange={(e) => setToProvinceId(e.target.value)}
                                        >
                                            <option value="">Thành phố đến</option>
                                            {provinces.map(p => <option key={p.id} value={p.id}>{p.nameVi || p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Dates & Times */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                {/* Departure Leg */}
                                <div className={`${isRoundTrip ? 'lg:col-span-5' : 'lg:col-span-10'} grid grid-cols-2 gap-4`}>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày đi</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                            <Input
                                                type="date"
                                                value={departureDate}
                                                onChange={(e) => setDepartureDate(e.target.value)}
                                                className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Giờ đi</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                            <Input
                                                type="time"
                                                value={departureTime}
                                                onChange={(e) => setDepartureTime(e.target.value)}
                                                className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Return Leg (Optional) */}
                                {isRoundTrip && (
                                    <div className="lg:col-span-5 grid grid-cols-2 gap-4 animate-in slide-in-from-left-4 duration-500">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 text-orange-500">Ngày về</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                                                <Input
                                                    type="date"
                                                    value={returnDate}
                                                    onChange={(e) => setReturnDate(e.target.value)}
                                                    className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                                    min={departureDate}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 text-orange-500">Giờ về</label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                                                <Input
                                                    type="time"
                                                    value={returnTime}
                                                    onChange={(e) => setReturnTime(e.target.value)}
                                                    className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Search Button */}
                                <div className="lg:col-span-2">
                                    <Button
                                        onClick={handleSearch}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Search className="h-6 w-6" />
                                        <span>Tìm kiếm</span>
                                    </Button>
                                </div>
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
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mt-1 line-clamp-1">{vehicle.attribute?.departurePoint || 'Hà Nội'}</p>
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

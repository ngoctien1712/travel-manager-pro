import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customerApi } from '@/api/customer.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Building2, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';
import { ServiceCardSkeleton } from '@/components/LoadingSkeleton';

import { geographyApi } from '@/api/geography.api';

export const HotelLanding = () => {
    const [search, setSearch] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [wardId, setWardId] = useState('');

    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    // Search Filters
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [guestCount, setGuestCount] = useState('2');

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
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

    // Fetch Districts
    useEffect(() => {
        if (provinceId) {
            geographyApi.listAreas(provinceId).then(res => setDistricts(res.data));
        } else {
            setDistricts([]);
            setDistrictId('');
        }
    }, [provinceId]);

    // Fetch Wards
    useEffect(() => {
        if (districtId) {
            geographyApi.listWards(districtId).then(res => setWards(res.data));
        } else {
            setWards([]);
            setWardId('');
        }
    }, [districtId]);

    const { data, isLoading } = useQuery({
        queryKey: ['listHotels', provinceId, districtId, wardId, search, checkInDate, checkOutDate, guestCount],
        queryFn: () => customerApi.listServices({
            type: 'accommodation',
            provinceId,
            districtId,
            wardId,
            q: search,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guestCount
        }),
    });

    return (
        <div className="bg-[#F7F9FA] min-h-screen pb-20">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920')] bg-cover bg-center"
                />
                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px]" />

                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-xl tracking-tight">
                        Nghỉ dưỡng đẳng cấp, giá hời nhất
                    </h1>
                    <p className="text-lg opacity-90 font-medium drop-shadow-md">
                        Hơn 1.000.000 khách sạn, biệt thự và căn hộ đang chờ bạn khám phá
                    </p>
                </div>
            </section>

            {/* Search Box - Specific for Hotels */}
            <div className="container max-w-6xl relative z-20 -mt-24 px-4">
                <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tỉnh / Thành phố</label>
                                <select
                                    className="w-full h-14 pl-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                    value={provinceId}
                                    onChange={(e) => setProvinceId(e.target.value)}
                                >
                                    <option value="">Thành phố</option>
                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.nameVi || p.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Quận / Huyện</label>
                                <select
                                    className="w-full h-14 pl-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer disabled:opacity-50"
                                    value={districtId}
                                    onChange={(e) => setDistrictId(e.target.value)}
                                    disabled={!provinceId}
                                >
                                    <option value="">Chọn Quận / Huyện</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Phường / Xã</label>
                                <select
                                    className="w-full h-14 pl-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer disabled:opacity-50"
                                    value={wardId}
                                    onChange={(e) => setWardId(e.target.value)}
                                    disabled={!districtId}
                                >
                                    <option value="">Chọn Phường / Xã</option>
                                    {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tìm theo tên</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tên khách sạn..."
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày nhận phòng</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        type="date"
                                        value={checkInDate}
                                        onChange={(e) => setCheckInDate(e.target.value)}
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày trả phòng</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        type="date"
                                        value={checkOutDate}
                                        onChange={(e) => setCheckOutDate(e.target.value)}
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                        min={checkInDate}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Số lượng khách</label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <select
                                        value={guestCount}
                                        onChange={(e) => setGuestCount(e.target.value)}
                                        className="w-full h-14 pl-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="1">1 Khách</option>
                                        <option value="2">2 Khách</option>
                                        <option value="3">3 Khách</option>
                                        <option value="4">4 Khách</option>
                                        <option value="5">5+ Khách</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98]">
                                    <Search className="mr-2 h-5 w-5" /> Tìm khách sạn
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Promotion Section */}
            <section className="container max-w-6xl py-12 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group relative h-64 rounded-[2.5rem] overflow-hidden shadow-xl transition-all hover:-translate-y-1">
                        <img src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Promo 1" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent flex flex-col justify-center p-10 text-white">
                            <Badge className="w-fit bg-orange-500 mb-3 border-none font-black px-4 py-1 rounded-full">HOT DEAL 40%</Badge>
                            <h3 className="font-black text-3xl mb-2 tracking-tighter">Luxury Resort <br /> Đà Nẵng</h3>
                            <p className="text-sm opacity-80 font-medium">Đặt phòng ngay để nhận ưu đãi bữa sáng miễn phí và nâng hạng phòng.</p>
                        </div>
                    </div>
                    <div className="group relative h-64 rounded-[2.5rem] overflow-hidden shadow-xl transition-all hover:-translate-y-1">
                        <img src="https://images.unsplash.com/photo-1540206276207-3af25c08abbb?w=800" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Promo 2" />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-transparent flex flex-col justify-center p-10 text-white">
                            <Badge className="w-fit bg-blue-500 mb-3 border-none font-black px-4 py-1 rounded-full">Mã: HOTELSTAY</Badge>
                            <h3 className="font-black text-3xl mb-2 tracking-tighter">Staycation <br /> Tại Sài Gòn</h3>
                            <p className="text-sm opacity-80 font-medium">Giảm 25% cho các đơn hàng đặt vào ngày thường trong tuần.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="container max-w-6xl py-12 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white shadow-sm border border-gray-50 group hover:border-blue-200 transition-colors">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 tracking-tight uppercase text-xs mb-1">Giá cuối cùng</p>
                            <p className="text-sm text-gray-400 font-bold">Đã bao gồm thuế & phí</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white shadow-sm border border-gray-50 group hover:border-blue-200 transition-colors">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 tracking-tight uppercase text-xs mb-1">Đối tác đa dạng</p>
                            <p className="text-sm text-gray-400 font-bold">Từ Homestay đến Resort</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white shadow-sm border border-gray-50 group hover:border-blue-200 transition-colors">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Zap size={32} />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 tracking-tight uppercase text-xs mb-1">Xác nhận tức thì</p>
                            <p className="text-sm text-gray-400 font-bold">Đặt phòng nhanh chóng</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="container max-w-6xl py-10 px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-blue-600" /> Khách sạn phổ biến
                    </h2>
                    <Link to="/?type=accommodation" className="text-blue-600 font-bold hover:underline">Xem thêm</Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                    ) : (
                        data?.items.map((hotel: any) => (
                            <Link key={hotel.id_item} to={`/services/${hotel.id_item}`} className="group">
                                <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white">
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={getImageUrl(hotel.thumbnail)}
                                            alt={hotel.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <Badge className="bg-white/95 text-blue-600 font-black text-[10px] uppercase shadow-sm">
                                                {hotel.hotel_type || 'HOTEL'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <h3 className="font-bold text-gray-1000 line-clamp-2 h-10 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                                            {hotel.title}
                                        </h3>
                                        <div className="flex items-center gap-1 mb-3">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    className={i < (hotel.star_rating || hotel.attribute?.stars || 5) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                                            {(hotel.attribute?.amenities || []).slice(0, 3).map((am: string) => (
                                                <span key={am} className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md capitalize">
                                                    {am.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4">
                                            <MapPin size={12} className="text-blue-400" />
                                            {hotel.city_name || 'Việt Nam'}
                                        </div>
                                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá mỗi đêm</span>
                                                <span className="text-lg font-black text-blue-600 leading-tight">{formatCurrency(hotel.price)}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200 transition-all">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default HotelLanding;

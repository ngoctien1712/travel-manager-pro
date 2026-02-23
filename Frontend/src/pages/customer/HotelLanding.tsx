import { useState } from 'react';
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

export const HotelLanding = () => {
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    const { data, isLoading } = useQuery({
        queryKey: ['listHotels', city, search],
        queryFn: () => customerApi.listServices({ type: 'accommodation', city, q: search }),
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
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-5 space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Điểm đến hoặc tên khách sạn</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Thành phố, khu vực hoặc tên khách sạn"
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Thời gian lưu trú</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        type="text"
                                        placeholder="27 Th02 - 01 Th03 (2 đêm)"
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-3 space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Khách & Phòng</label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                    <Input
                                        placeholder="2 Khách, 1 Phòng"
                                        className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-600 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-12">
                                <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98]">
                                    <Search className="mr-2 h-6 w-6" /> Tìm khách sạn
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Trust Badges */}
            <section className="container max-w-6xl py-12 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-50">
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">Giá cuối cùng</p>
                            <p className="text-xs text-gray-500 font-medium">Đã bao gồm thuế & phí</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-50">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">Đối tác đa dạng</p>
                            <p className="text-xs text-gray-500 font-medium">Từ Homestay đến Resort 5 sao</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-50">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <Zap size={28} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">Xác nhận tức thì</p>
                            <p className="text-xs text-gray-500 font-medium">Đặt phòng chỉ trong 2 phút</p>
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

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customerApi } from '@/api/customer.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Compass, Search, MapPin, Star, ArrowRight, Sparkles, Camera, Utensils, Waves } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';
import { ServiceCardSkeleton } from '@/components/LoadingSkeleton';

export const ActivityLanding = () => {
    const [search, setSearch] = useState('');

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return 'https://images.unsplash.com/photo-1542332213-31f826288ee2?w=800';
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    const { data, isLoading } = useQuery({
        queryKey: ['listActivities', search],
        queryFn: () => customerApi.listServices({ type: 'tour', q: search }),
    });

    const categories = [
        { name: 'Công viên giải trí', icon: <Sparkles className="text-purple-500" />, color: 'bg-purple-50' },
        { name: 'Tour trong ngày', icon: <Compass className="text-blue-500" />, color: 'bg-blue-50' },
        { name: 'Vé tham quan', icon: <Camera className="text-emerald-500" />, color: 'bg-emerald-50' },
        { name: 'Ẩm thực', icon: <Utensils className="text-orange-500" />, color: 'bg-orange-50' },
        { name: 'Thể thao nước', icon: <Waves className="text-cyan-500" />, color: 'bg-cyan-50' },
    ];

    return (
        <div className="bg-[#F7F9FA] min-h-screen pb-20">
            {/* Hero Section */}
            <section className="relative h-[450px] flex items-center justify-center text-white overflow-hidden">
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542332213-31f826288ee2?w=1920')] bg-cover bg-center"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <Badge className="bg-blue-600 text-white border-none font-bold text-xs uppercase mb-6 px-4 py-1.5 rounded-full shadow-lg animate-bounce">
                        Khám phá mới mỗi ngày
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-2xl tracking-tight leading-[1.1]">
                        Trải nghiệm tuyệt vời nhất<br />cho kỳ nghỉ của bạn
                    </h1>
                    <p className="text-xl opacity-90 font-medium drop-shadow-md mb-8">
                        Tìm kiếm tour, hoạt động giải trí và vé tham quan trên toàn quốc
                    </p>

                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500 group-focus-within:scale-110 transition-transform" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Bạn muốn đi đâu hoặc làm gì?..."
                            className="w-full h-16 pl-16 pr-8 bg-white/95 backdrop-blur-md border-none rounded-[2rem] text-gray-900 font-bold text-lg shadow-2xl focus-visible:ring-blue-500 placeholder:text-gray-400"
                        />
                        <Button className="absolute right-3 top-1/2 -translate-y-1/2 h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black shadow-lg shadow-blue-200">
                            Tìm kiếm
                        </Button>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="container max-w-6xl py-12 px-4 -mt-12 relative z-20">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group">
                            <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                {cat.icon}
                            </div>
                            <span className="text-xs font-black text-gray-900 text-center leading-tight uppercase tracking-tight">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Featured Activities */}
            <section className="container max-w-6xl py-10 px-4">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <Sparkles className="text-blue-600" /> Trải nghiệm nổi bật
                        </h2>
                        <p className="text-gray-500 font-medium text-sm mt-1">Được lựa chọn kỹ lưỡng để mang đến kỳ nghỉ hoàn hảo cho bạn</p>
                    </div>
                    <Button variant="outline" className="rounded-full border-gray-100 font-bold px-6">Khám phá thêm</Button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                    ) : (
                        data?.items.map((activity: any) => (
                            <Link key={activity.id_item} to={`/services/${activity.id_item}`} className="group">
                                <Card className="h-full border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={getImageUrl(activity.thumbnail)}
                                            alt={activity.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-blue-600 text-white font-black text-[9px] uppercase px-3 py-1 shadow-lg shadow-blue-200">
                                                {activity.item_type === 'tour' ? 'TOUR' : 'TICKET'}
                                            </Badge>
                                        </div>
                                        {/* Glass Overlay for Pricing */}
                                        <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 flex items-center justify-between">
                                            <div>
                                                <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] opacity-80 mb-0.5">Giá bắt đầu từ</p>
                                                <span className="text-xl font-black text-white drop-shadow-sm">{formatCurrency(activity.price)}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                                <ArrowRight size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-0.5 text-yellow-400">
                                                    <Star size={14} className="fill-current" />
                                                    <span className="text-sm font-black text-gray-900">4.9</span>
                                                </div>
                                                <span className="text-xs text-gray-400 font-bold">(1k+)</span>
                                            </div>
                                            {activity.attribute?.durationDays && (
                                                <Badge variant="outline" className="text-[9px] font-black border-blue-100 text-blue-600 rounded-lg">
                                                    {activity.attribute.durationDays} NGÀY
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors h-10">
                                            {activity.title}
                                        </h3>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                                <MapPin size={14} className="text-blue-500" />
                                                {activity.city_name || 'Việt Nam'}
                                            </div>
                                            {activity.attribute?.tourType && (
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {activity.attribute.tourType}
                                                </span>
                                            )}
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

export default ActivityLanding;

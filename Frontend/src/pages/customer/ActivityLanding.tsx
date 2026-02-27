import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customerApi } from '@/api/customer.api';
import { geographyApi } from '@/api/geography.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Compass, Search, MapPin, Star, ArrowRight, Sparkles, Camera, Utensils, Waves, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';
import { ServiceCardSkeleton } from '@/components/LoadingSkeleton';

export const ActivityLanding = () => {
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [provinces, setProvinces] = useState<any[]>([]);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await geographyApi.listCountries();
                const vn = res.data.find((c: any) => c.code === 'VN' || c.name === 'Vietnam');
                const countryId = vn?.id || res.data[0]?.id;
                if (countryId) {
                    const cityRes = await geographyApi.listCities(countryId);
                    setProvinces(cityRes.data);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách tỉnh thành:', error);
            }
        };
        fetchProvinces();
    }, []);

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const getImageUrl = (url: string | null) => {
        if (!url) return 'https://images.unsplash.com/photo-1542332213-31f826288ee2?w=800';
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    const { data, isLoading } = useQuery({
        queryKey: ['listActivities', search, selectedDate, provinceId],
        queryFn: () => customerApi.listServices({ type: 'tour', q: search, date: selectedDate, provinceId }),
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

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tên hoạt động, địa điểm..."
                                className="w-full h-16 pl-16 pr-8 bg-white border-none rounded-[2rem] text-gray-900 font-bold text-lg shadow-2xl focus-visible:ring-blue-500"
                            />
                            <div className="absolute top-[-10px] left-8 bg-blue-600 px-2 text-[9px] font-black text-white uppercase tracking-widest rounded-md">Tìm kiếm</div>
                        </div>
                        <div className="md:col-span-3 relative group">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
                            <select
                                value={provinceId}
                                onChange={(e) => setProvinceId(e.target.value)}
                                className="w-full h-16 pl-16 pr-8 bg-white border-none rounded-[2rem] text-gray-900 font-bold text-lg shadow-2xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="">Toàn quốc</option>
                                {provinces.map(p => <option key={p.id} value={p.id}>{p.nameVi || p.name}</option>)}
                            </select>
                            <div className="absolute top-[-10px] left-8 bg-blue-600 px-2 text-[9px] font-black text-white uppercase tracking-widest rounded-md">Vị trí</div>
                        </div>
                        <div className="md:col-span-3 relative group">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full h-16 pl-16 pr-8 bg-white border-none rounded-[2rem] text-gray-900 font-bold text-lg shadow-2xl focus-visible:ring-blue-500"
                            />
                            <div className="absolute top-[-10px] left-8 bg-blue-600 px-2 text-[9px] font-black text-white uppercase tracking-widest rounded-md">Thời gian</div>
                        </div>
                        <div className="md:col-span-1">
                            <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black shadow-lg shadow-blue-200">
                                <Search size={28} />
                            </Button>
                        </div>
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

            {/* Promotion Section */}
            <section className="container max-w-6xl py-12 px-4">
                <div className="bg-gray-900 rounded-[3rem] p-8 md:p-12 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/20 blur-3xl rounded-full translate-x-1/2 group-hover:bg-blue-600/30 transition-all duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase px-4 py-1.5 rounded-full mb-2">Chương trình độc quyền</Badge>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">Mùa hè rực rỡ <br /> Giảm tới 40% vé tham quan</h2>
                            <p className="text-gray-400 font-medium text-lg">Áp dụng cho VinWonders, Sun World và hàng trăm địa điểm khác trên toàn quốc.</p>
                            <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                <Button className="h-14 px-10 bg-white text-gray-900 hover:bg-gray-100 rounded-2xl font-black">XUỐNG PHỐ NGAY</Button>
                                <Button variant="outline" className="h-14 px-10 border-white/20 text-white hover:bg-white/10 rounded-2xl font-black">TÌM HIỂU THÊM</Button>
                            </div>
                        </div>
                        <div className="w-full md:w-80 h-80 rounded-[2.5rem] overflow-hidden shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700">
                            <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600" className="w-full h-full object-cover" alt="Promo" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Activities */}
            <section className="container max-w-6xl py-16 px-4">
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <Sparkles className="text-blue-600" /> Trải nghiệm nổi bật
                        </h2>
                        <p className="text-gray-500 font-medium text-sm mt-1">Lựa chọn hàng đầu cho chuyến đi của bạn</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className={`rounded-2xl border-gray-100 font-black text-xs uppercase tracking-widest px-6 h-12 ${isFilterOpen ? 'bg-blue-50 border-blue-200' : ''}`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            Bộ lọc <ArrowRight size={14} className={`ml-2 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                    ) : (
                        data?.items.map((activity: any) => (
                            <Link key={activity.id_item} to={`/services/${activity.id_item}`} className="group">
                                <Card className="h-full border-none shadow-[0_4px_30px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.12)] transition-all duration-700 rounded-[3rem] overflow-hidden bg-white group-hover:-translate-y-3">
                                    <div className="relative h-72 overflow-hidden">
                                        <img
                                            src={getImageUrl(activity.thumbnail)}
                                            alt={activity.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                            <Badge className="bg-white/95 backdrop-blur-md text-blue-600 font-black text-[9px] uppercase px-4 py-1.5 rounded-full shadow-lg border-none tracking-widest">
                                                {activity.item_type === 'tour' ? 'TOUR' : 'VÉ THAM QUAN'}
                                            </Badge>
                                            <div className="bg-black/40 backdrop-blur-md text-white rounded-full px-3 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                                                <MapPin size={10} className="text-blue-400" />
                                                {activity.city_name || 'Việt Nam'}
                                            </div>
                                        </div>

                                        <div className="absolute bottom-6 left-6 right-6">
                                            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-5 border border-white/20 flex items-center justify-between shadow-2xl">
                                                <div>
                                                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Giá từ</p>
                                                    <span className="text-2xl font-black text-white drop-shadow-md">{formatCurrency(activity.price)}</span>
                                                </div>
                                                <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xl transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-45">
                                                    <ArrowRight size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-0.5 text-yellow-400 bg-yellow-50 px-3 py-1 rounded-full">
                                                <Star size={12} className="fill-current" />
                                                <span className="text-xs font-black text-yellow-700">4.9</span>
                                            </div>
                                            <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Kỹ năng cực đỉnh</span>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-6 min-h-[3rem]">
                                            {activity.title}
                                        </h3>
                                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <Compass size={14} className="text-blue-500" />
                                                <span>Xác nhận tức thì</span>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] font-black border-blue-50 text-blue-500 px-3 py-1 rounded-xl uppercase">
                                                Ưu đãi mới nhất
                                            </Badge>
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

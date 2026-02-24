import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { customerApi } from '@/api/customer.api';
import { geographyApi } from '@/api/geography.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceCardSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import {
  Map, Building2, Ticket, Sparkles, Star, MapPin,
  ArrowRight, Search, Calendar, Users, Filter, X
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ReactNode> = {
  tour: <Map className="h-5 w-5" />,
  accommodation: <Building2 className="h-5 w-5" />,
  hotel: <Building2 className="h-5 w-5" />,
  ticket: <Ticket className="h-5 w-5" />,
  vehicle: <Sparkles className="h-5 w-5" />,
  experience: <Sparkles className="h-5 w-5" />,
};

const ServiceCard = ({ service, getImageUrl }: { service: any; getImageUrl: (url: string | null) => string }) => (
  <Link to={`/services/${service.id}`} className="group h-full">
    <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white group-hover:-translate-y-2">
      <div className="relative h-60 overflow-hidden">
        <img
          src={getImageUrl(service.thumbnail)}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge className="bg-white/90 backdrop-blur text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-none shadow-sm">
            {service.type === 'accommodation' ? 'Khách sạn' : service.type === 'tour' ? 'Tour' : service.type === 'vehicle' ? 'Vận chuyển' : 'Vé'}
          </Badge>
          <div className="bg-black/50 backdrop-blur text-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm text-[10px] font-bold">
            <MapPin size={10} className="text-blue-400" />
            {service.location || service.city}
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center gap-1 text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
          {iconMap[service.type] || <Sparkles size={12} />}
          <span>{service.type}</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors h-12 mb-4">
          {service.name}
        </h3>

        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} className={i < (service.rating || 5) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"} />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Giá chỉ từ</p>
            <span className="text-xl font-black text-blue-600">{formatCurrency(service.price)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-45">
            <ArrowRight size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

interface ServiceFilters {
  q: string;
  type: string;
  provinceId: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
}

export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<ServiceFilters>({
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    provinceId: searchParams.get('provinceId') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    date: searchParams.get('date') || '',
  });

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800';
    if (url.startsWith('http')) return url;
    return `${backendUrl}${url}`;
  };

  // Home data for banners and destinations
  const { data: homeData, isLoading: isHomeLoading } = useQuery({
    queryKey: ['home'],
    queryFn: () => customerApi.getHome(),
  });

  const [provinces, setProvinces] = useState<any[]>([]);

  useEffect(() => {
    geographyApi.listCountries().then((res) => {
      const vn = res.data.find((c: any) => c.code === 'VN' || c.name === 'Vietnam');
      const countryId = vn?.id || res.data[0]?.id;
      if (countryId) {
        geographyApi.listCities(countryId).then((cityRes) => {
          setProvinces(cityRes.data);
        });
      }
    });
  }, []);

  // Service listing data based on filters
  const { data: servicesData, isLoading: isServicesLoading, refetch } = useQuery({
    queryKey: ['listServices', filters],
    queryFn: () => customerApi.listServices(filters),
  });

  useEffect(() => {
    // Sync filters with URL
    const nextParams: Record<string, string> = {};
    if (filters.q) nextParams.q = filters.q;
    if (filters.type && filters.type !== 'all') nextParams.type = filters.type;
    if (filters.provinceId) nextParams.provinceId = filters.provinceId;
    if (filters.minPrice != null) nextParams.minPrice = String(filters.minPrice);
    if (filters.maxPrice != null) nextParams.maxPrice = String(filters.maxPrice);
    if (filters.date) nextParams.date = filters.date;
    setSearchParams(nextParams);
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
    // Scroll to results
    document.getElementById('services-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({ q: '', type: '', provinceId: '', date: '' });
  };

  return (
    <div className="page-enter bg-[#F7F9FA]">
      {/* Hero Section - Traveloka Style */}
      <section className="relative h-[480px] flex flex-col items-center justify-center text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528127269322-539801943592?w=1920')] bg-cover bg-center transition-transform duration-[10s] hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-blue-900/40 to-[#F7F9FA]" />

        <div className="relative z-10 text-center px-4 max-w-4xl mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 drop-shadow-lg tracking-tight">
            Khám phá thế giới, <br /> bắt đầu từ đây
          </h1>
          <p className="text-lg md:text-xl opacity-90 drop-shadow-md font-medium">
            Hàng ngàn tour, khách sạn và phương tiện đang chờ đón bạn
          </p>
        </div>

        {/* Floating Search Bar */}
        <div className="relative z-20 w-full max-w-5xl px-4 mt-[-60px] md:mt-[-80px]">
          <Card className="shadow-2xl border-none rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3 relative group">
                  <Input
                    placeholder="Bạn muốn đi đâu?"
                    className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-500 text-sm md:text-md font-medium"
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="absolute top-[-10px] left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Địa điểm / Tên</div>
                </div>

                <div className="md:col-span-2 relative">
                  <Select
                    value={filters.provinceId}
                    onValueChange={(val) => setFilters({ ...filters, provinceId: val === 'all' ? '' : val })}
                  >
                    <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-blue-500 text-sm md:text-md font-medium px-4 pl-12 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <SelectValue placeholder="Toàn quốc" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl max-h-[300px]">
                      <SelectItem value="all" className="font-medium">Tất cả khu vực</SelectItem>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="font-medium">
                          {p.nameVi || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="absolute top-[-10px] left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Khu vực</div>
                </div>

                <div className="md:col-span-2 relative">
                  <Select value={filters.type} onValueChange={(val) => setFilters({ ...filters, type: val })}>
                    <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-blue-500 text-sm md:text-md font-medium px-4">
                      <div className="flex items-center gap-2">
                        {filters.type && filters.type !== 'all' ? iconMap[filters.type] : <Sparkles className="h-5 w-5 text-gray-400" />}
                        <SelectValue placeholder="Loại hình" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="all" className="font-medium">Tất cả</SelectItem>
                      <SelectItem value="tour" className="font-medium">Tour</SelectItem>
                      <SelectItem value="accommodation" className="font-medium">Khách sạn</SelectItem>
                      <SelectItem value="vehicle" className="font-medium">Xe</SelectItem>
                      <SelectItem value="ticket" className="font-medium">Vé</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="absolute top-[-10px] left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Danh mục</div>
                </div>

                <div className="md:col-span-3 relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <Input
                    type="date"
                    className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus-visible:ring-blue-500 text-sm md:text-md font-medium"
                    value={filters.date || ''}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  />
                  <div className="absolute top-[-10px] left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</div>
                </div>

                <div className="md:col-span-2">
                  <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                    Tìm kiếm
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Horizontal */}
      <section className="container max-w-7xl pt-24 pb-12 overflow-x-auto scrollbar-hide">
        <div className="flex justify-center gap-4 min-w-max px-4">
          <Link
            to="/activities"
            className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] min-w-[140px] transition-all duration-300 border bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
              {iconMap['tour']}
            </div>
            <span className="font-bold text-sm">Tour du lịch</span>
          </Link>
          <Link
            to="/hotels"
            className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] min-w-[140px] transition-all duration-300 border bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
              {iconMap['accommodation']}
            </div>
            <span className="font-bold text-sm">Khách sạn</span>
          </Link>
          <Link
            to="/bus-shuttle"
            className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] min-w-[140px] transition-all duration-300 border bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
              {iconMap['vehicle']}
            </div>
            <span className="font-bold text-sm">Phương tiện</span>
          </Link>
          <Link
            to="/activities"
            className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] min-w-[140px] transition-all duration-300 border bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
              {iconMap['ticket']}
            </div>
            <span className="font-bold text-sm">Vé tham quan</span>
          </Link>
        </div>
      </section>

      {/* Main Content: Services List with Filters */}
      <section id="services-list" className="container max-w-7xl py-12 px-4">
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {(filters.q || (filters.type && filters.type !== 'all') || filters.provinceId) ? 'Kết quả tìm kiếm' : 'Dịch vụ nổi bật'}
            </h2>
            <p className="text-gray-400 font-medium mt-1">
              Khám phá {servicesData?.items.length || 0} trải nghiệm tốt nhất cho chuyến đi của bạn
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className={`rounded-xl border-gray-200 font-bold ${isFilterOpen ? 'bg-blue-50 border-blue-300 text-blue-600' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc nâng cao
              {(filters.minPrice || filters.maxPrice) && <Badge className="ml-2 bg-blue-500 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">!</Badge>}
            </Button>
            {(filters.q || (filters.type && filters.type !== 'all') || filters.provinceId || filters.minPrice) && (
              <Button variant="ghost" className="text-gray-400 hover:text-red-500 font-bold" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Xóa lọc
              </Button>
            )}
          </div>
        </div>

        {/* Compact Filters UI */}
        {isFilterOpen && (
          <Card className="mb-10 border-none shadow-lg rounded-3xl bg-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Khoảng giá (VNĐ)</h4>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="rounded-xl bg-gray-50 border-none h-12 font-bold"
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <div className="w-4 h-0.5 bg-gray-200" />
                    <Input
                      type="number"
                      placeholder="Max"
                      className="rounded-xl bg-gray-50 border-none h-12 font-bold"
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Sắp xếp theo</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-50 border-gray-200 text-gray-600 font-bold">Mới nhất</Badge>
                    <Badge variant="outline" className="px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-50 border-gray-200 text-gray-600 font-bold">Giá thấp nhất</Badge>
                    <Badge variant="outline" className="px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-50 border-gray-200 text-gray-600 font-bold">Đánh giá cao</Badge>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <Button className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all" onClick={() => setIsFilterOpen(false)}>
                    Áp dụng bộ lọc
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorized Featured Sections */}
        {isHomeLoading ? (
          <section className="container max-w-7xl py-12 px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
            </div>
          </section>
        ) : (
          <div className="space-y-20 pb-20">
            {/* Top Accommodations */}
            {homeData?.topAccommodations && homeData.topAccommodations.length > 0 && (
              <section className="container max-w-7xl px-4">
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-2">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <Building2 className="text-blue-600" /> Khách sạn nổi bật
                    </h2>
                    <p className="text-gray-400 font-medium">Top chỗ ở được đánh giá cao nhất bởi khách hàng</p>
                  </div>
                  <Link to="/hotels" className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 group/btn">
                    Xem tất cả <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {homeData.topAccommodations.map((service) => (
                    <ServiceCard key={service.id} service={service} getImageUrl={getImageUrl} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Tours */}
            {homeData?.topTours && homeData.topTours.length > 0 && (
              <section className="container max-w-7xl px-4">
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-2">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <Map className="text-orange-500" /> Tour du lịch hấp dẫn
                    </h2>
                    <p className="text-gray-400 font-medium">Khám phá những vùng đất mới với lịch trình chuyên nghiệp</p>
                  </div>
                  <Link to="/activities" className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 group/btn">
                    Xem tất cả <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {homeData.topTours.map((service) => (
                    <ServiceCard key={service.id} service={service} getImageUrl={getImageUrl} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Vehicles */}
            {homeData?.topVehicles && homeData.topVehicles.length > 0 && (
              <section className="container max-w-7xl px-4">
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-2">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <Sparkles className="text-emerald-500" /> Phương tiện di chuyển
                    </h2>
                    <p className="text-gray-400 font-medium">Dịch vụ xe khách, xe đưa đón chất lượng cao</p>
                  </div>
                  <Link to="/bus-shuttle" className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 group/btn">
                    Xem tất cả <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {homeData.topVehicles.map((service) => (
                    <ServiceCard key={service.id} service={service} getImageUrl={getImageUrl} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Tickets */}
            {homeData?.topTickets && homeData.topTickets.length > 0 && (
              <section className="container max-w-7xl px-4">
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-2">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <Ticket className="text-purple-500" /> Vé tham quan
                    </h2>
                    <p className="text-gray-400 font-medium">Tiết kiệm thời gian, không cần xếp hàng mua vé</p>
                  </div>
                  <Link to="/activities" className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 group/btn">
                    Xem tất cả <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {homeData.topTickets.map((service) => (
                    <ServiceCard key={service.id} service={service} getImageUrl={getImageUrl} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Legacy Search Results Section (Keep for functionality) */}
        {(filters.q || (filters.type && filters.type !== 'all') || filters.provinceId) && (
          <section id="services-list" className="container max-w-7xl py-12 px-4 border-t border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-8">Kết quả tìm kiếm phù hợp</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {isServicesLoading ? (
                Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
              ) : servicesData?.items.length === 0 ? (
                <div className="col-span-full py-10">
                  <EmptyState title="Không tìm thấy dịch vụ nào" description="Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn." />
                </div>
              ) : (
                servicesData?.items.map((service) => (
                  <Link key={service.id_item} to={`/services/${service.id_item}`} className="group">
                    <ServiceCard service={{ ...service, id: service.id_item, name: service.title, type: service.item_type, rating: service.rating || service.star_rating, location: service.city_name }} getImageUrl={getImageUrl} />
                  </Link>
                ))
              )}
            </div>
          </section>
        )}
      </section>

      {/* Popular Destinations - Static from Traveloka */}
      <section className="bg-white py-24">
        <div className="container max-w-7xl px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Điểm đến phổ biến</h2>
              <p className="text-gray-400 font-medium mt-1">Những thành phố được yêu thích nhất bởi du khách</p>
            </div>
            <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl">
              Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {homeData?.popularDestinations.slice(0, 4).map((dest) => (
              <button
                key={dest.id}
                className="relative h-80 rounded-[2.5rem] overflow-hidden group shadow-md"
                onClick={() => setFilters({ ...filters, provinceId: dest.id })}
              >
                <img
                  src={getImageUrl(dest.image)}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 text-white text-left">
                  <h3 className="font-black text-2xl tracking-tight mb-1">{dest.name}</h3>
                  <div className="flex items-center gap-2 opacity-80">
                    <Badge className="bg-white/20 backdrop-blur border-none font-bold text-xs">
                      {dest.serviceCount} dịch vụ
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container max-w-7xl py-24 px-4 text-center">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex items-center justify-center">
              <Sparkles size={32} />
            </div>
            <h4 className="font-black text-xl text-gray-900">Chất lượng hàng đầu</h4>
            <p className="text-gray-500 text-sm leading-relaxed px-8">Dịch vụ được chọn lọc kỹ càng, đảm bảo trải nghiệm tốt nhất cho khách hàng.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-500 flex items-center justify-center">
              <Calendar size={32} />
            </div>
            <h4 className="font-black text-xl text-gray-900">Đặt chỗ linh hoạt</h4>
            <p className="text-gray-500 text-sm leading-relaxed px-8">Hủy phòng hoặc đổi lịch trình dễ dàng với chính sách linh hoạt.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[2rem] bg-green-50 text-green-500 flex items-center justify-center">
              <Users size={32} />
            </div>
            <h4 className="font-black text-xl text-gray-900">Hỗ trợ 24/7</h4>
            <p className="text-gray-500 text-sm leading-relaxed px-8">Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng hỗ trợ bạn mọi lúc mọi nơi.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
import { useState, useEffect, useRef } from 'react';
import adLeft from '@/assets/banners/ads-left.jpg';
import adRight from '@/assets/banners/ads-right.jpg';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import { customerApi } from '@/api/customer.api';
import {
  MapPin,
  User,
  Phone,
  Calendar,
  Home,
  Ticket as TicketIcon,
  CheckCircle2,
  Tag,
  Star,
  Info,
  Clock,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Utensils,
  Eye,
  Users,
  Car,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Armchair
} from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

interface ServiceDetail {
  id_item: string;
  title: string;
  item_type: string;
  price?: number;
  attribute?: any;
  description?: string;
  media?: Array<{ id_media: string; type: string; url: string }>;
  tags?: string[];

  // Provider info
  id_provider?: string;
  provider_name?: string;
  provider_phone?: string;
  provider_image?: string;
  provider_legal_documents?: string[];

  // Location
  area_name?: string;
  city_name?: string;
  country_name?: string;
  area_attribute?: {
    climate_type?: string;
    average_temperature?: { min: number; max: number; unit: string };
    rainy_season?: { from_month: number; to_month: number };
    best_travel_months?: number[];
    weather_notes?: string[];
  };

  // Tour specific
  guide_language?: string;
  start_at?: string;
  end_at?: string;
  max_slots?: number;
  remaining_slots?: number;
  tour_attribute?: {
    tour_type?: string;
    duration_days?: number;
    departure_point?: string;
    itinerary?: Array<{ day: number; title: string; activities: string[] }>;
    hotel_standard?: string;
    meals?: { breakfast: number; lunch: number; dinner: number };
    tour_highlights?: string[];
  };

  // Accommodation specific
  address?: string;
  hotel_type?: string;
  star_rating?: number;
  checkin_time?: string;
  checkout_time?: string;
  policies?: any;
  acc_attribute?: {
    type?: string;
    stars?: number;
    amenities?: string[];
    views?: string[];
    description?: string;
  };
  rooms?: Array<{
    id_room: string;
    name_room: string;
    max_guest: number;
    price: number;
    attribute: any;
    media?: any[];
    description?: string;
  }>;
  positions?: Array<{
    id_position: string;
    code_position: string;
    price: number;
    is_booked: boolean;
  }>;
  trips?: Array<{
    id_trip: string;
    id_vehicle: string;
    departure_time: string;
    arrival_time?: string;
    price_override?: number;
    status: string;
  }>;

  // POI specific
  poi_name?: string;
  poi_type?: {
    poi_category?: string;
    poi_sub_type?: string;
    rating?: { score: number; reviews_count: number };
    price_range?: { min: number; max: number; currency: string; level: string };
    activities?: string[];
    recommended_time?: { time_of_day: string[]; avg_duration_minutes: number };
    crowd_level?: { weekday: string; weekend: string };
    suitability?: Record<string, boolean>;
    tags?: string[];
  };

  // Vehicle specific
  id_vehicle?: string;
  code_vehicle?: string;
  max_guest?: number;
  departure_time?: string;
  departure_point?: string;
  arrival_time?: string;
  arrival_point?: string;
  departure_date?: string;
  arrival_date?: string;
  estimatedDuration?: string;
  vehicle_attribute?: any;

  // Expanded Provider Info
  provider_description?: string;
  provider_address?: string;
  provider_email?: string;
  provider_website?: string;
  provider_social_links?: any;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [relatedServices, setRelatedServices] = useState<any[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [stickyStyle, setStickyStyle] = useState<React.CSSProperties>({ position: 'sticky', top: '96px' });

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!sidebarRef.current) return;

      const sidebar = sidebarRef.current;
      const viewportHeight = window.innerHeight;
      const sidebarHeight = sidebar.offsetHeight;
      const scrollY = window.scrollY;
      const scrollingDown = scrollY > lastScrollY;

      // Traveloka-style sticky: if taller than screen, stick to bottom on down, top on up
      if (sidebarHeight > viewportHeight - 100) {
        if (scrollingDown) {
          setStickyStyle({
            position: 'sticky',
            top: `calc(${viewportHeight}px - ${sidebarHeight}px - 32px)`,
            alignSelf: 'flex-end'
          });
        } else {
          setStickyStyle({
            position: 'sticky',
            top: '96px',
            alignSelf: 'flex-start'
          });
        }
      } else {
        setStickyStyle({ position: 'sticky', top: '96px' });
      }

      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const [data, vData] = await Promise.all([
          customerApi.getServiceDetail(id!),
          customerApi.getApplicableVouchers(id!)
        ]);
        setService(data);
        setVouchers(vData);

        // Fetch related services in the same city
        if (data.city_name) {
          try {
            const related = await customerApi.listServices({ city: data.city_name });
            setRelatedServices(related.items.filter((item: any) => item.id_item !== id).slice(0, 4));
          } catch (relErr) {
            console.error('Error fetching related services:', relErr);
          }
        }

        if (data.media && data.media.length > 0) {
          setActiveImage(data.media[0].url);
        }

        // No longer auto-selecting trip as we use service base schedule
        setError(null);
      } catch (err) {
        setError('Không tìm thấy dịch vụ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchService();
  }, [id]);

  // No need to fetch booked seats here anymore as it is done in BookingPage.tsx

  const handleBookingRedirect = () => {
    let query = `?quantity=${quantity}`;
    if (service.item_type === 'accommodation' && selectedRoom) {
      query += `&id_room=${selectedRoom.id_room}`;
    } else if (service.item_type === 'vehicle') {
      if (selectedTrip) query += `&id_trip=${selectedTrip.id_trip}`;
    } else if (service.item_type === 'tour') {
      query += `&booking_date=${bookingDate}`;
    }
    navigate(`/booking/${id}${query}`);
  };



  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingSkeleton />;
  if (!service) return <ErrorState message="Không tìm thấy dịch vụ" />;

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=1000&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${cleanUrl}`;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 overflow-x-hidden font-sans relative">
      {/* Full-height Skyscraper Ads */}
      <div className="hidden 2xl:block fixed left-4 top-24 bottom-8 w-48 z-[5] group cursor-pointer">
        <div className="h-full rounded-[2.5rem] overflow-hidden bg-white shadow-2xl border border-white/20 relative">
          <img src={adLeft} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Halong Bay Ad" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent p-10 flex flex-col justify-end text-white text-left items-start">
            <div className="mb-auto">
              <Badge className="bg-white/20 backdrop-blur text-white border-none font-bold text-[8px] uppercase tracking-widest px-3 py-1 mb-2">DI SẢN THẾ GIỚI</Badge>
              <div className="h-1 w-12 bg-blue-400 rounded-full mb-4" />
            </div>
            <h4 className="text-2xl font-black uppercase italic leading-none mb-2">VỊNH <br /> HẠ LONG</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-6 font-medium">Trải nghiệm du thuyền 5 sao đẳng cấp</p>
            <Button size="sm" className="bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-black text-[9px] uppercase tracking-widest h-10 w-full shadow-lg">KHÁM PHÁ NGAY</Button>
          </div>
        </div>
      </div>
      <div className="hidden 2xl:block fixed right-4 top-24 bottom-8 w-48 z-[5] group cursor-pointer">
        <div className="h-full rounded-[2.5rem] overflow-hidden bg-white shadow-2xl border border-white/20 relative">
          <img src={adRight} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Ancient Town Ad" />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-950/90 via-orange-900/40 to-transparent p-10 flex flex-col justify-end text-white text-right items-end">
            <div className="mb-auto">
              <Badge className="bg-white/20 backdrop-blur text-white border-none font-bold text-[8px] uppercase tracking-widest px-3 py-1 mb-2">HỘI AN CHILL</Badge>
              <div className="h-1 w-12 bg-orange-400 rounded-full mb-4 ml-auto" />
            </div>
            <h4 className="text-2xl font-black uppercase italic leading-none mb-2">PHỐ CỔ <br /> HOÀI NIỆM</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-6 font-medium text-right">Combo phòng khách sạn & vé show Ký Ức</p>
            <Button size="sm" className="bg-white text-orange-900 hover:bg-orange-50 rounded-xl font-black text-[9px] uppercase tracking-widest h-10 w-full shadow-lg">ĐẶT VÉ NGAY</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-20 py-8">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ChevronLeft size={16} /> Quay lại trang trước
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-wider px-3 py-1">
                {service.item_type}
              </Badge>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} className="fill-current" />
                <span className="text-sm font-black text-gray-900">4.9</span>
                <span className="text-xs text-gray-400 font-bold ml-1">(1k+ lượt đặt)</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1] mb-4">
              {service.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-500 font-bold flex-wrap">
              <MapPin size={18} className="text-blue-500 shrink-0" />
              <span className="text-sm">{service.city_name}, {service.area_name}</span>
              <button className="text-blue-600 text-xs font-black uppercase tracking-widest ml-2 hover:underline">Xem trên bản đồ</button>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Button variant="outline" className="rounded-xl font-bold border-gray-200 hover:bg-white hover:border-blue-200 transition-all">Chia sẻ</Button>
            <Button variant="outline" className="rounded-xl font-bold border-gray-200 text-red-500 hover:bg-red-50 transition-all">Yêu thích</Button>
          </div>
        </div>

        {/* Gallery ảnh chủ đạo - Traveloka Style (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100/20 max-h-[600px]">
          <div className="md:col-span-2 md:row-span-2 relative group cursor-pointer" onClick={() => setActiveImage(service.media?.[0]?.url || null)}>
            <img
              src={getImageUrl(service.media?.[0]?.url || null)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Main"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {service.media?.slice(1, 5).map((m, idx) => (
            <div key={idx} className="relative group cursor-pointer overflow-hidden" onClick={() => setActiveImage(m.url)}>
              <img
                src={getImageUrl(m.url)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={`Sub ${idx}`}
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {idx === 3 && service.media.length > 5 && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-white font-black text-xl">+{service.media.length - 5}</span>
                </div>
              )}
            </div>
          ))}
          {(!service.media || service.media.length < 5) && Array.from({ length: 5 - (service.media?.length || 0) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-gray-100 flex items-center justify-center text-gray-300">
              <TicketIcon size={32} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* CỘT TRÁI: Nội dung chi tiết */}
          <div className="lg:col-span-8 space-y-12">

            {/* Giới thiệu */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Giới thiệu trải nghiệm</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-10 whitespace-pre-line">{service.description}</p>

              {/* General Attributes */}
              {service.attribute && Object.keys(service.attribute).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-gray-50">
                  {Object.entries(service.attribute).map(([k, v]: [string, any]) => {
                    // Skip complex objects already rendered in specific sections
                    const skipKeys = ['itinerary', 'timetable', 'meals', 'facilities', 'amenities', 'views', 'tourHighlights', 'rooms', 'positions', 'poiActivities'];
                    if (skipKeys.includes(k)) return null;

                    const formatValue = (val: any): string => {
                      if (val === null || val === undefined || val === '') return '';
                      if (Array.isArray(val)) return val.join(' • ');
                      if (typeof val === 'object') return ''; // Don't render complex objects here
                      return String(val);
                    };
                    const displayValue = formatValue(v);
                    if (!displayValue) return null;
                    return (
                      <div key={k} className="flex flex-col gap-1.5 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                        <span className="text-gray-900 font-bold text-sm">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Vouchers Section - Cải tiến hiển thị mã ngay tại trang chi tiết */}
            {vouchers.length > 0 && (
              <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full opacity-50 blur-3xl" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Tag size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Mã giảm giá độc quyền</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Sử dụng mã khi tiến hành đặt chỗ</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {vouchers.map((v) => {
                    const isPercentage = v.discount_type === 'percentage';
                    const displayValue = isPercentage
                      ? `${Math.round(v.discount_value)}%`
                      : v.discount_value >= 1000
                        ? `${Math.floor(v.discount_value / 1000)}k`
                        : v.discount_value.toLocaleString();

                    return (
                      <div key={v.id_voucher} className="group relative bg-white border border-blue-100 rounded-[2rem] p-0 flex items-stretch hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 overflow-hidden">
                        {/* Left Part: Discount Amount */}
                        <div className="w-32 bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center text-white relative px-4 shrink-0">
                          {/* Semi-circles for ticket effect */}
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full" />
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full" />

                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Giảm</span>
                          <span className="text-3xl font-black tracking-tighter leading-none">{displayValue}</span>

                          {/* Decorative lines */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-white/20 border-r border-dashed border-white/40" />
                        </div>

                        {/* Right Part: Details */}
                        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {v.voucher_type === 'time' && <Badge className="bg-orange-50 text-orange-600 border-none text-[8px] font-black px-2 py-0.5">GIỚI HẠN GIỜ</Badge>}
                              {v.voucher_type === 'price' && <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black px-2 py-0.5">ƯU ĐÃI GIÁ</Badge>}
                              <h4 className="font-black text-gray-900 uppercase text-xs truncate">{v.name || v.code}</h4>
                            </div>
                            <p className="text-[10px] font-bold text-gray-500 line-clamp-2 leading-relaxed">
                              {v.description || `Đơn tối thiểu ${Number(v.min_order_value).toLocaleString()}đ`}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center justify-between overflow-hidden">
                              <code className="text-[11px] font-bold text-blue-700 truncate">{v.code}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-white text-blue-600"
                                onClick={() => {
                                  navigator.clipboard.writeText(v.code);
                                  alert('Đã sao chép mã!');
                                }}
                              >
                                <ExternalLink size={12} />
                              </Button>
                            </div>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(v.code);
                                alert('Đã sao chép: ' + v.code + '. Hãy sử dụng ở bước đặt chỗ!');
                              }}
                              className="bg-gray-900 hover:bg-black text-white h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shrink-0 shadow-lg shadow-gray-200 transition-transform active:scale-95"
                            >
                              SAO CHÉP
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TOUR SPECIFIC */}
            {service.item_type === 'tour' && (
              <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">Thông tin hành trình</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 rounded-3xl bg-gray-50 flex flex-col items-center text-center">
                    <Tag size={24} className="text-blue-500 mb-3" />
                    <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Loại / Còn trống</span>
                    <span className="font-bold text-gray-900 capitalize">
                      {service.attribute?.tourType || service.tour_attribute?.tour_type || 'Trọn gói'}
                      {service.remaining_slots !== undefined && ` (${service.remaining_slots} chỗ)`}
                    </span>
                  </div>
                  <div className="p-6 rounded-3xl bg-gray-50 flex flex-col items-center text-center">
                    <Clock size={24} className="text-blue-500 mb-3" />
                    <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Thời lượng</span>
                    <span className="font-bold text-gray-900">{service.attribute?.durationDays || service.tour_attribute?.duration_days || '1'} ngày</span>
                  </div>
                  <div className="p-6 rounded-3xl bg-gray-50 flex flex-col items-center text-center">
                    <MapPin size={24} className="text-blue-500 mb-3" />
                    <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Điểm đón</span>
                    <span className="font-bold text-gray-900 truncate w-full">{service.attribute?.departurePoint || service.tour_attribute?.departure_point || service.city_name}</span>
                  </div>
                  <div className="p-6 rounded-3xl bg-gray-50 flex flex-col items-center text-center">
                    <ShieldCheck size={24} className="text-blue-500 mb-3" />
                    <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Khách sạn</span>
                    <span className="font-bold text-gray-900">{service.attribute?.hotelStandard || service.tour_attribute?.hotel_standard || 'Tiêu chuẩn'}</span>
                  </div>
                </div>

                {/* Tour Highlights */}
                {(service.attribute?.tourHighlights || service.tour_attribute?.tour_highlights) && (
                  <div className="p-8 rounded-[2.5rem] bg-blue-50/50 border border-blue-100">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Sparkles size={18} className="text-blue-600" /> Điểm nhấn hành trình
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(service.attribute?.tourHighlights || service.tour_attribute?.tour_highlights || []).map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-gray-700 font-bold text-sm leading-tight">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Meals */}
                {(service.attribute?.meals || service.tour_attribute?.meals) && (
                  <div className="flex flex-wrap gap-8 py-6 border-y border-gray-50">
                    <div className="flex items-center gap-3">
                      <Utensils size={20} className="text-gray-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">Chế độ ăn uống:</span>
                    </div>
                    {[
                      { label: 'Bữa sáng', count: service.attribute?.meals?.breakfast || service.tour_attribute?.meals?.breakfast },
                      { label: 'Bữa trưa', count: service.attribute?.meals?.lunch || service.tour_attribute?.meals?.lunch },
                      { label: 'Bữa tối', count: service.attribute?.meals?.dinner || service.tour_attribute?.meals?.dinner },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">{m.count || 0}</span>
                        <span className="text-xs text-gray-500 font-medium">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Itinerary Timeline */}
                <div className="space-y-10 pt-4">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">Lịch trình chi tiết</div>
                  {(service.attribute?.itinerary || service.tour_attribute?.itinerary)?.map((it: any, idx: number) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          {idx + 1}
                        </div>
                        {idx < ((service.attribute?.itinerary || service.tour_attribute?.itinerary || []).length - 1) && <div className="w-0.5 h-full bg-gray-100 my-2" />}
                      </div>
                      <div className="flex-1 pb-12">
                        <h5 className="font-black text-gray-900 text-xl mb-4 group-hover:text-blue-600 transition-colors">Ngày {it.day || idx + 1}: {it.title}</h5>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(it.activities || []).map((act: string, i: number) => (
                            <li key={i} className="flex items-center gap-3 text-gray-600 text-sm p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="font-medium">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                  {!(service.attribute?.itinerary || service.tour_attribute?.itinerary) && (
                    <div className="text-gray-400 italic text-sm text-center py-10">Lịch trình đang được cập nhật...</div>
                  )}
                </div>
              </section>
            )}

            {/* ACCOMMODATION SPECIFIC */}
            {service.item_type === 'accommodation' && (
              <div className="space-y-12">
                <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-12">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Home size={24} />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">Dịch vụ & Tiện nghi</h3>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={20} className={i < (service.attribute?.stars || service.acc_attribute?.stars || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex flex-col items-center text-center">
                        <Home size={20} className="text-blue-500 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Loại hình</p>
                        <p className="font-black text-gray-900 text-sm whitespace-nowrap">{service.hotel_type || 'Khách sạn'}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100/50 flex flex-col items-center text-center">
                        <Clock size={20} className="text-emerald-500 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Check-in</p>
                        <p className="font-black text-gray-900 text-sm">{service.checkin_time || '14:00'}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-100/50 flex flex-col items-center text-center">
                        <Clock size={20} className="text-orange-500 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Check-out</p>
                        <p className="font-black text-gray-900 text-sm">{service.checkout_time || '12:00'}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-purple-50/50 border border-purple-100/50 flex flex-col items-center text-center">
                        <Star size={20} className="text-purple-500 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Xếp hạng</p>
                        <p className="font-black text-gray-900 text-sm">{service.star_rating || '4.5'} Sao</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ShieldCheck size={14} className="text-blue-500" /> Chính sách & Quy định
                        </h4>
                        <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                          {service.policies ? (
                            Object.entries(typeof service.policies === 'string' ? JSON.parse(service.policies) : service.policies).map(([k, v]: [string, any]) => (
                              <div key={k} className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{k}</p>
                                  <p className="text-sm font-bold text-gray-700">{v}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <p className="text-sm font-bold text-gray-700">Hủy phòng: Hoàn tiền trước 24h</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <p className="text-sm font-bold text-gray-700">Trẻ em: Miễn phí dưới 6 tuổi</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <p className="text-sm font-bold text-gray-700">Thú cưng: Không được phép</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Utensils size={14} className="text-orange-500" /> Tiện ích khách sạn
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(service.attribute?.amenities || service.acc_attribute?.amenities || []).map((f: string) => (
                            <div key={f} className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-xs font-bold text-gray-600 shadow-sm hover:border-blue-200 transition-all flex items-center gap-2">
                              <CheckCircle2 size={12} className="text-emerald-500" /> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-12">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-[#0094FF] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A2B48] uppercase tracking-tighter">Hạng phòng hiện có</h2>
                  </div>

                  <div className="space-y-10">
                    {service.rooms?.map((room) => {
                      const isSelected = selectedRoom?.id_room === room.id_room;
                      const roomSize = room.attribute?.room_size || '32.0 m²';
                      const facilities = room.attribute?.facilities || [];

                      return (
                        <div
                          key={room.id_room}
                          className={`bg-white rounded-[1.5rem] border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm ${isSelected ? 'ring-4 ring-blue-100 border-blue-400' : 'hover:shadow-md'
                            }`}
                        >
                          {/* Header: Room Name */}
                          <div className="bg-[#EBF5FF] px-8 py-5 border-b border-gray-100">
                            <h4 className="text-xl font-black text-[#1A2B48]">{room.name_room}</h4>
                          </div>

                          <div className="flex flex-col lg:flex-row p-0">
                            {/* Left: Image and Features */}
                            <div className="lg:w-1/4 p-8 border-r border-gray-100 bg-white">
                              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-inner mb-6">
                                <img
                                  src={getImageUrl(room.media?.[0]?.url || room.attribute?.images?.[0])}
                                  className="w-full h-full object-cover"
                                  alt={room.name_room}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-y-4 mb-6">
                                <div className="flex items-center gap-3 text-gray-500">
                                  <Sparkles size={18} className="text-gray-400" />
                                  <span className="text-xs font-bold leading-none">{roomSize}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                  <MessageCircle size={18} className="text-gray-400" />
                                  <span className="text-xs font-bold leading-none">Vòi tắm đứng</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                  <CloudSun size={18} className="text-gray-400" />
                                  <span className="text-xs font-bold leading-none">Máy lạnh</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                  <ExternalLink size={18} className="text-gray-400" />
                                  <span className="text-xs font-bold leading-none">WiFi miễn phí</span>
                                </div>
                              </div>

                              <button className="text-[#0094FF] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:underline">
                                <Eye size={16} /> Xem chi tiết phòng
                              </button>
                            </div>

                            {/* Right: Options Table */}
                            <div className="flex-1 flex flex-col">
                              {/* Table Headers */}
                              <div className="grid grid-cols-12 bg-[#F7F9FB] border-b border-gray-100 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500">
                                <div className="col-span-5 font-black text-[#1A2B48]">Lựa chọn phòng</div>
                                <div className="col-span-2 text-center">Khách</div>
                                <div className="col-span-3 text-center">Giá/phòng/đêm</div>
                                <div className="col-span-1 text-center">Phòng</div>
                                <div className="col-span-1"></div>
                              </div>

                              {/* Table Row */}
                              <div className="grid grid-cols-12 flex-1 items-center px-6 py-8 divide-x divide-gray-50">
                                <div className="col-span-5 pr-8 space-y-3">
                                  <p className="text-[10px] font-bold text-gray-400 leading-tight">Deluxe Room - Breakfast Included</p>
                                  <h5 className="text-base font-black text-[#1A2B48]">Bữa sáng cho {room.max_guest} người</h5>
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                      <Armchair size={14} /> 1 giường đôi
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                      <CheckCircle2 size={14} /> Miễn phí hủy phòng
                                    </div>
                                  </div>
                                </div>

                                <div className="col-span-2 px-4 flex justify-center items-center gap-1">
                                  {Array.from({ length: room.max_guest }).map((_, i) => (
                                    <User key={i} size={20} className="text-gray-400" />
                                  ))}
                                </div>

                                <div className="col-span-3 px-4 text-center space-y-1">
                                  <p className="text-[12px] font-bold text-gray-400 line-through">{(room.price * 1.2).toLocaleString()} VND</p>
                                  <p className="text-2xl font-black text-[#FF5E1F] tracking-tighter">{(room.price).toLocaleString()} VND</p>
                                  <p className="text-[10px] font-bold text-gray-400">Chưa bao gồm thuế và phí</p>
                                </div>

                                <div className="col-span-1 px-4 text-center font-black text-gray-800 text-sm">
                                  x1
                                </div>

                                <div className="col-span-1 pl-4 flex justify-end">
                                  <Button
                                    onClick={() => {
                                      setSelectedRoom(room);
                                      setTimeout(() => document.getElementById('accommodation-booking-confirm')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                                    }}
                                    className={`h-11 px-8 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isSelected
                                      ? 'bg-gray-900 text-white'
                                      : 'bg-[#0094FF] text-white hover:bg-blue-600 shadow-blue-100 hover:-translate-y-0.5'
                                      }`}
                                  >
                                    {isSelected ? 'ĐÃ CHỌN' : 'CHỌN'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Booking Confirmation Section for Accommodation */}
                {selectedRoom && (
                  <section id="accommodation-booking-confirm" className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <div className="bg-gradient-to-br from-gray-900 via-blue-950 to-black rounded-[2.5rem] p-1 md:p-1.5 shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
                      {/* Interactive background shine */}
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />

                      <div className="bg-white/5 backdrop-blur-sm rounded-[2.3rem] p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 border border-white/10">
                        <div className="flex items-center gap-8">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl relative">
                            <img
                              src={getImageUrl(selectedRoom.media?.[0]?.url || selectedRoom.attribute?.images?.[0])}
                              className="w-full h-full object-cover"
                              alt="selected"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Phòng bạn đang chọn</p>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">{selectedRoom.name_room}</h4>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-2 text-xs font-black text-white/60"><Users size={14} className="text-blue-500" /> {selectedRoom.max_guest} Khách</span>
                              <span className="flex items-center gap-2 text-xs font-black text-white/60"><Clock size={14} className="text-blue-500" /> Nhận phòng 14:00</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12 w-full lg:w-auto">
                          <div className="text-center lg:text-right space-y-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Giá tạm tính (1 đêm)</p>
                            <div className="flex items-baseline gap-2 justify-center lg:justify-end">
                              <span className="text-4xl font-black text-white tracking-tighter">{(selectedRoom.price).toLocaleString()}đ</span>
                            </div>
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Miễn phí hủy phòng trước 24h</p>
                          </div>

                          <Button
                            onClick={handleBookingRedirect}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-12 h-16 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/50 hover:shadow-blue-600/40 transition-all hover:scale-105 active:scale-95 group uppercase tracking-tight flex items-center gap-4"
                          >
                            Xác nhận & Đặt phòng ngay
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                              <ChevronRight size={20} />
                            </div>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* VEHICLE / TICKET SHARED */}
            {(service.item_type === 'vehicle' || service.item_type === 'ticket') && (
              <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {service.item_type === 'vehicle' ? <Car size={24} /> : <TicketIcon size={24} />}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">Chi tiết dịch vụ</h3>
                </div>

                {service.item_type === 'vehicle' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <Clock size={20} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Giờ khởi hành</p>
                        <p className="font-black text-gray-900 text-base">{service.departure_time || service.attribute?.departure_time || '08:00'}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <MapPin size={20} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Điểm đón</p>
                        <p className="font-black text-gray-900 text-sm line-clamp-1">{service.departure_point || service.attribute?.departure_point || 'Bến xe trung tâm'}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <Users size={20} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Số chỗ</p>
                        <p className="font-black text-gray-900 text-base">{service.max_guest || service.attribute?.maxGuest || 45} chỗ</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <ShieldCheck size={20} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tiện nghi</p>
                        <p className="font-black text-gray-900 text-[10px] line-clamp-1">{(service.attribute?.facilities || []).slice(0, 2).join(', ') || 'Ghế ngả, USB'}</p>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="bg-blue-50/30 rounded-[2.5rem] p-8 md:p-12 border border-blue-100/50">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="text-center md:text-left flex-1">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Khởi hành</p>
                          <p className="text-4xl font-black text-gray-900 mb-2">{service.departure_time || service.attribute?.departure_time || '08:00'}</p>
                          <p className="font-black text-blue-600 text-sm">{service.departure_point || service.attribute?.departure_point || 'Ga Hà Nội'}</p>
                        </div>

                        <div className="flex-[1.5] w-full flex flex-col items-center gap-3">
                          <div className="flex items-center gap-3">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{service.estimatedDuration || service.attribute?.estimatedDuration || '4 tiếng 30 phút'}</span>
                          </div>
                          <div className="w-full h-1 bg-gray-200 rounded-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-600 w-1/2 rounded-full" />
                          </div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Hành trình trực tiếp</p>
                        </div>

                        <div className="text-center md:text-right flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Điểm đến</p>
                          <p className="text-4xl font-black text-gray-900 mb-2">{service.arrival_time || service.attribute?.arrival_time || '12:30'}</p>
                          <p className="font-black text-gray-500 text-sm">{service.arrival_point || service.attribute?.arrival_point || 'Ga Đà Nẵng'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TICKET / POI INFO ... existing code ... */}

                {service.item_type === 'vehicle' && (
                  <div className="pt-8 border-t border-gray-50 flex flex-col items-center justify-center p-12 bg-blue-50/20 rounded-[3rem] border border-dashed border-blue-100">
                    <Car size={48} className="text-blue-500 mb-4 opacity-50" />
                    <h4 className="text-lg font-black text-blue-900 uppercase tracking-widest mb-2">Thông tin vị trí ghế</h4>
                    <p className="text-sm text-blue-600/70 font-medium text-center max-w-xs">Sơ đồ ghế trống và lựa chọn vị trí sẽ hiển thị ở bước tiếp theo khi bạn nhấn đặt chỗ.</p>
                  </div>
                )}
              </section>
            )}

            {/* Replace Area Experience with General Travel Ads */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-blue-50 shadow-sm space-y-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Sparkles size={120} className="text-blue-500" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">GỢI Ý TỪ TRAVELPRO</Badge>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Trải nghiệm không nên bỏ lỡ</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="group cursor-pointer">
                  <div className="aspect-video rounded-3xl overflow-hidden mb-4 shadow-lg border border-gray-100">
                    <img src={getImageUrl('/uploads/ads/combo-vinpearl.jpg')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Ad 1" />
                  </div>
                  <h4 className="font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Combo Nghỉ dưỡng 3N2Đ tại Vinpearl</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Giảm ngay 2.000.000đ khi đặt trong hôm nay</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="aspect-video rounded-3xl overflow-hidden mb-4 shadow-lg border border-gray-100">
                    <img src={getImageUrl('/uploads/ads/platinum-member.jpg')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Ad 2" />
                  </div>
                  <h4 className="font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Thẻ Thành viên TravelPro Platinum</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Đặc quyền phòng chờ thương gia & Bảo hiểm cao cấp</p>
                </div>
              </div>

              <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-black text-blue-900 mb-1">Chương trình Khách hàng Thân thiết</h4>
                  <p className="text-sm text-blue-700 font-medium">Tích lũy điểm thưởng cho mỗi giao dịch và đổi lấy vé máy bay miễn phí.</p>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-8 shrink-0 shadow-lg shadow-blue-200">Tìm hiểu thêm</Button>
              </div>
            </section>

            {/* Promotional Banner */}
            <div className="rounded-[2.5rem] overflow-hidden relative h-56 group shadow-2xl shadow-blue-100/50 mt-12 bg-gray-900 border-none">
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" alt="Promotion" />
              <div className="absolute inset-0 flex flex-col justify-center p-12 text-white">
                <Badge className="w-fit bg-blue-600 mb-4 border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1 text-white">Đặc quyền VIP</Badge>
                <h3 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-white italic">Giảm thêm 15% khi đặt qua App</h3>
                <p className="text-sm font-medium opacity-80 max-w-md text-white/80">Quét mã QR để nhận coupon giảm giá đặc biệt dành riêng cho khách hàng thân thiết của TravelPro.</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://travel-pro.vn/app" className="w-full h-full" alt="QR" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white/60">Quét để tải App</p>
                </div>
              </div>
            </div>

            {/* Safety Information to fill space */}
            <div className="bg-emerald-50 rounded-[2.5rem] p-10 border border-emerald-100 mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-black text-emerald-900 uppercase">Thông tin an toàn & Sức khỏe</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <p className="text-sm font-medium text-emerald-800">Khử khuẩn định kỳ và tuân thủ quy tắc 5K trong suốt hành trình.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <p className="text-sm font-medium text-emerald-800">Nhân viên được tiêm chủng đầy đủ và kiểm tra sức khỏe hàng tuần.</p>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: Card đặt chỗ & Nhà cung cấp */}
          <div className="lg:col-span-4">
            <div ref={sidebarRef} style={stickyStyle} className="space-y-8">

              {/* Accommodation Specific Sidebar Content */}
              {service.item_type === 'accommodation' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
                  {/* Property Quick Overview */}
                  <Card className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] border border-gray-50">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                          {service.acc_attribute?.type || 'Luxury Resort'}
                        </Badge>
                        <div className="flex items-center gap-1 text-yellow-400">
                          {Array.from({ length: Math.round(service.star_rating || 4) }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 font-black italic">Vị trí đắc địa</h4>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group cursor-pointer hover:border-blue-200 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <MapPin size={18} />
                          </div>
                          <p className="text-xs font-black text-gray-700 leading-snug line-clamp-3 uppercase italic">
                            {service.address || service.city_name || 'Hội An, Quảng Nam'}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={20} className="text-white/80" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Đặc quyền Premium</p>
                        </div>
                        <p className="text-xs font-medium text-white/90 leading-relaxed italic">Nhận ngay ưu đãi nâng hạng phòng khi đặt qua App TravelPro.</p>
                        <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-black text-[10px] uppercase tracking-widest h-10">TẢI APP NGAY</Button>
                      </div>
                    </div>
                  </Card>

                  {/* Nearby Activities (Real Data) */}
                  {relatedServices.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 pl-4">
                        <Sparkles size={14} className="text-blue-500" /> Hoạt động lân cận
                      </h4>
                      <div className="space-y-4">
                        {relatedServices.map((rel: any) => (
                          <Card
                            key={rel.id_item}
                            onClick={() => navigate(`/services/${rel.id_item}`)}
                            className="bg-white rounded-3xl p-3 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                          >
                            <div className="flex gap-4">
                              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                                <img src={getImageUrl(rel.media?.[0]?.url || rel.thumbnail)} alt={rel.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              </div>
                              <div className="flex flex-col justify-center py-1">
                                <Badge className="w-fit bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase mb-1 border-none">{rel.item_type}</Badge>
                                <h5 className="font-black text-gray-900 text-[11px] uppercase tracking-tight line-clamp-2 leading-tight mb-1">{rel.title}</h5>
                                <p className="text-[11px] font-black text-blue-600 tracking-tighter">{(rel.price || 0).toLocaleString()}đ</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Booking Card (for tours/vehicles) */}
              <div id="booking-card" className={`bg-white rounded-[2.5rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden relative ${service.item_type === 'accommodation' ? 'hidden' : ''}`}>
                <div className="absolute top-0 right-0 p-6 flex flex-col gap-2 items-end">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Xác nhận tức thì</Badge>
                </div>

                <div className="mb-8 text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Thông tin đặt chỗ</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black tracking-tighter text-gray-900">
                      {service.item_type === 'vehicle'
                        ? (Number(service.price || 0)).toLocaleString() // Just show base price in card, actual total shown in booking page
                        : (quantity * (service.price || 0)).toLocaleString()
                      }đ
                    </span>
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">tổng phí</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {(service.item_type === 'tour' || service.item_type === 'ticket') && (
                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chọn ngày khởi hành</label>
                      <div className="relative group">
                        <Input
                          type="date"
                          className="h-14 rounded-2xl bg-white border-gray-200 font-bold text-sm focus:ring-2 focus:ring-blue-600 transition-all pl-12"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <Calendar className="absolute left-4 top-4 text-blue-500" size={20} />
                      </div>
                    </div>
                  )}

                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái dịch vụ</p>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} /> <span>Còn chỗ trống</span>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={handleBookingRedirect}
                      className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-[0.98] uppercase"
                    >
                      ĐẶT CHỖ NGAY
                    </Button>
                    <p className="text-center mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Không mất phí đặt chỗ</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/my-orders')}
                      className="text-gray-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest h-auto p-2"
                    >
                      Lịch sử đặt chỗ của tôi
                    </Button>
                  </div>
                </div>

                {/* Travel Guarantee Badge */}
                <div className="p-6 bg-blue-50 border-t border-blue-100 flex items-center gap-4">
                  <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                  <div>
                    <p className="text-[10px] font-black text-blue-900 uppercase">TravelPro Guarantee</p>
                    <p className="text-[9px] font-medium text-blue-700">Giá tốt nhất - Hoàn tiền nếu tìm được giá rẻ hơn.</p>
                  </div>
                </div>
              </div>

              {/* Nhà cung cấp & Support */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border-4 border-white shadow-xl relative">
                    {service.provider_legal_documents && service.provider_legal_documents.length > 0 ? (
                      <img src={getImageUrl(service.provider_legal_documents[0])} alt={service.provider_name} className="w-full h-full object-cover" />
                    ) : service.provider_image ? (
                      <img src={getImageUrl(service.provider_image)} alt={service.provider_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200"><User size={32} /></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-gray-900 leading-tight">{service.provider_name || 'VietTravel Premium'}</h4>
                  </div>
                </div>

                {service.provider_description && (
                  <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-blue-200 pl-4">
                    {service.provider_description}
                  </p>
                )}

                <div className="space-y-3 pt-2">
                  {service.provider_address && (
                    <div className="flex items-start gap-3 text-xs text-gray-500">
                      <MapPin size={14} className="shrink-0 text-blue-400" />
                      <span>{service.provider_address}</span>
                    </div>
                  )}
                  {service.provider_email && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <Phone size={14} className="shrink-0 text-blue-400 rotate-90" />
                      <span>{service.provider_email}</span>
                    </div>
                  )}
                  {service.provider_website && (
                    <div className="flex items-center gap-3 text-xs text-blue-500">
                      <ExternalLink size={14} className="shrink-0" />
                      <a href={service.provider_website.startsWith('http') ? service.provider_website : `https://${service.provider_website}`} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">
                        Website chính thức
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <a href={`tel:${service.provider_phone}`} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Hotline hỗ trợ</p>
                      <p className="font-bold text-gray-900 text-sm">{service.provider_phone || '1900 1234'}</p>
                    </div>
                  </a>

                  <Button
                    onClick={() => {
                      const chatBtn = document.getElementById('chat-widget-trigger') as HTMLButtonElement;
                      if (chatBtn) chatBtn.click();
                    }}
                    className="w-full flex items-center gap-4 p-4 h-auto rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border-none transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <MessageCircle size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">Hỗ trợ trực tuyến</p>
                      <p className="font-bold text-blue-900 text-sm">Chat với {service.provider_name}</p>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Additional Sidebar Ads */}
              <div className="space-y-4">
                <div className="rounded-[2.5rem] overflow-hidden bg-orange-600 relative h-64 group shadow-xl">
                  <img src={getImageUrl('/uploads/ads/resort-special.jpg')} className="w-full h-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-110" alt="Resort Ad" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <Badge className="w-fit bg-white text-orange-600 mb-4 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">ƯU ĐÃI ĐẶC BIỆT</Badge>
                    <h4 className="text-xl font-black mb-1 leading-tight uppercase tracking-tighter italic">Voucher Ẩm thực <br /> Trị giá 500k</h4>
                    <p className="text-[10px] font-medium opacity-80 mb-4">Tặng kèm khi đặt phòng khách sạn 5 sao trong tuần này</p>
                    <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 rounded-xl font-black text-[10px] uppercase tracking-widest h-10">NHẬN NGAY</Button>
                  </div>
                </div>

                <div className="rounded-[2.5rem] overflow-hidden bg-emerald-600 relative h-64 group shadow-xl">
                  <img src={getImageUrl('/uploads/ads/global-insurance.jpg')} className="w-full h-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-110" alt="Insurance Ad" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white text-right items-end">
                    <Badge className="w-fit bg-white text-emerald-600 mb-4 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">MIỄN PHÍ</Badge>
                    <h4 className="text-xl font-black mb-1 leading-tight uppercase tracking-tighter italic">Bảo hiểm <br /> Du lịch Toàn cầu</h4>
                    <p className="text-[10px] font-medium opacity-80 mb-4">An tâm tận hưởng mọi hành trình cùng TravelPro Care</p>
                    <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-black text-[10px] uppercase tracking-widest h-10">TÌM HIỂU THÊM</Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Similar Services / Footer Tags */}
        <div className="mt-32 pt-16 border-t border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black text-gray-900 tracking-tight">Từ khóa liên quan</h4>
            <button className="text-gray-400 font-bold hover:text-gray-900 transition-colors uppercase text-[10px] tracking-widest">Về trang chủ</button>
          </div>
          <div className="flex flex-wrap gap-4">
            {service.tags?.map(tag => (
              <span key={tag} className="px-6 py-3 rounded-full bg-white border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer shadow-sm">
                #{tag}
              </span>
            ))}
            <span className="px-6 py-3 rounded-full bg-white border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer shadow-sm">#{service.city_name}</span>
            <span className="px-6 py-3 rounded-full bg-white border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer shadow-sm">#{service.item_type} giá rẻ</span>
          </div>
        </div>
      </div>

      {/* Mobile Floating Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 flex items-center justify-between shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá chỉ từ</p>
          <p className="text-xl font-black text-blue-600">
            {service.price?.toLocaleString() || 0}đ
          </p>
        </div>
        <Button
          onClick={handleBookingRedirect}
          className="rounded-2xl h-12 px-8 bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-200"
        >
          ĐẶT CHỖ
        </Button>
      </div>
      {service.id_provider && (
        <ChatWidget
          providerId={service.id_provider}
          providerName={service.provider_name || 'Nhà cung cấp'}
          itemId={service.id_item}
          itemName={service.title}
        />
      )}
    </div>
  );
}

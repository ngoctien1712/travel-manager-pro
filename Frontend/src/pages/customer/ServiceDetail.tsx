import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  ExternalLink
} from 'lucide-react';

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
  provider_name?: string;
  provider_phone?: string;
  provider_image?: string;

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
  departureTime?: string;
  departurePoint?: string;
  arrivalTime?: string;
  arrivalPoint?: string;
  estimatedDuration?: string;
  vehicle_attribute?: any;
  positions?: Array<{
    id_position: string;
    code_position: string;
    price: number;
    is_booked: boolean;
  }>;

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
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getServiceDetail(id!);
        setService(data);
        if (data.media && data.media.length > 0) {
          setActiveImage(data.media[0].url);
        }
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

  const handleBookingRedirect = () => {
    let query = `?quantity=${quantity}`;
    if (service.item_type === 'accommodation' && selectedRoom) {
      query += `&id_room=${selectedRoom.id_room}`;
    } else if (service.item_type === 'vehicle' && selectedTrip) {
      query += `&id_trip=${selectedTrip.id_trip}&seats=${selectedSeats.map(s => s.id_position).join(',')}`;
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
    <div className="bg-[#f8fafc] min-h-screen pb-20 overflow-x-hidden font-sans">
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

                  {/* Policies & Amenities */}
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

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Eye size={14} className="text-purple-500" /> Tầm nhìn & Cảnh quan
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {(service.attribute?.views || service.acc_attribute?.views || []).map((v: string) => (
                        <div key={v} className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-gray-50 text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all bg-white">
                          <Eye size={16} /> View {v}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {service.rooms && service.rooms.length > 0 && (
                  <div className="pt-8 border-t border-gray-50 space-y-6">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Các hạng phòng hiện có</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {service.rooms.map(room => (
                        <div key={room.id_room} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row justify-between items-center gap-6 ${selectedRoom?.id_room === room.id_room ? 'border-blue-600 bg-blue-50/30' : 'bg-gray-50 border-transparent hover:border-blue-200'}`}>
                          <div className="flex-1">
                            <h5 className="text-xl font-black text-gray-900 mb-2">{room.name_room}</h5>
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><Users size={14} /> {room.max_guest} Người</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="flex flex-wrap gap-2">
                                {(room.attribute?.facilities || []).slice(0, 3).map((f: string) => (
                                  <span key={f} className="text-blue-600 font-black">{f}</span>
                                ))}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{room.description}</p>
                          </div>
                          <div className="text-center md:text-right shrink-0">
                            <p className="text-3xl font-black text-blue-600 tracking-tight">{room.price.toLocaleString()}đ</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">/ đêm / phòng</p>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedRoom(room);
                              document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`rounded-xl h-12 px-8 font-black ${selectedRoom?.id_room === room.id_room ? 'bg-blue-600 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                          >
                            {selectedRoom?.id_room === room.id_room ? 'Đã chọn' : 'Chọn phòng'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
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
                        <p className="font-black text-gray-900 text-base">{service.departureTime || service.attribute?.departureTime || '08:00'}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <MapPin size={20} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Điểm đón</p>
                        <p className="font-black text-gray-900 text-sm line-clamp-1">{service.departurePoint || service.attribute?.departurePoint || 'Bến xe trung tâm'}</p>
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
                          <p className="text-4xl font-black text-gray-900 mb-2">{service.departureTime || service.attribute?.departureTime || '08:00'}</p>
                          <p className="font-black text-blue-600 text-sm">{service.departurePoint || service.attribute?.departurePoint || 'Ga Hà Nội'}</p>
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
                          <p className="text-4xl font-black text-gray-900 mb-2">{service.arrivalTime || service.attribute?.arrivalTime || '12:30'}</p>
                          <p className="font-black text-gray-500 text-sm">{service.arrivalPoint || service.attribute?.arrivalPoint || 'Ga Đà Nẵng'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TICKET / POI INFO ... existing code ... */}

                {service.item_type === 'vehicle' && service.trips && service.trips.length > 0 && (
                  <div className="pt-8 border-t border-gray-50 space-y-6">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Lịch khởi hành hiện có</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {service.trips.map(trip => (
                        <div
                          key={trip.id_trip}
                          onClick={() => setSelectedTrip(trip)}
                          className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedTrip?.id_trip === trip.id_trip ? 'border-blue-600 bg-blue-50/30' : 'bg-gray-50 border-transparent hover:border-blue-200'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Giờ đi</p>
                              <p className="text-2xl font-black text-gray-900">{new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              <p className="text-xs text-gray-500 font-bold">{new Date(trip.departure_time).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Giá từ</p>
                              <p className="text-xl font-black text-gray-900">{(Number(trip.price_override) || Number(service.price)).toLocaleString()}đ</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 italic">Dự kiến đến: {trip.arrival_time ? new Date(trip.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {service.item_type === 'vehicle' && selectedTrip && service.positions && service.positions.length > 0 && (
                  <div className="pt-8 space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest pl-2 border-l-4 border-blue-600">Sơ đồ chỗ ngồi chuyến {new Date(selectedTrip.departure_time).toLocaleTimeString()}</h4>
                      <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-100" /> Trống</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600 shadow-lg shadow-blue-200" /> Đang chọn</span>
                        <span className="flex items-center gap-2 opacity-30"><div className="w-3 h-3 rounded bg-gray-900" /> Đã đặt</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-8 bg-gray-50/50 p-10 rounded-[3rem] border-2 border-dashed border-gray-200">
                      <div className="grid grid-cols-4 gap-4">
                        {service.positions?.map(pos => {
                          const isSelected = selectedSeats.some(s => s.id_position === pos.id_position);
                          return (
                            <button
                              key={pos.id_position}
                              disabled={pos.is_booked}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSeats(prev => prev.filter(s => s.id_position !== pos.id_position));
                                } else {
                                  setSelectedSeats(prev => [...prev, pos]);
                                }
                              }}
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all transform active:scale-95 ${pos.is_booked
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110 border-none'
                                  : 'bg-white text-gray-900 border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 hover:shadow-xl'
                                }`}
                            >
                              {pos.code_position}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* AREA EXPERIENCE */}
            {service.area_attribute && (
              <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-10">
                <div className="flex items-center gap-4">
                  <CloudSun size={24} className="text-orange-500" />
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Kinh nghiệm tại {service.area_name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Khí hậu</p>
                        <p className="font-black text-gray-900 text-lg uppercase tracking-tight">{service.area_attribute.climate_type}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nhiệt độ TB</p>
                        <p className="font-black text-gray-900 text-lg">{service.area_attribute.average_temperature?.min}°-{service.area_attribute.average_temperature?.max}°C</p>
                      </div>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-orange-50/50 border border-orange-100 text-orange-900 font-bold italic text-sm leading-relaxed relative">
                      <Info size={16} className="mb-4 text-orange-500" />
                      "{service.area_attribute.weather_notes?.[0] || 'Vùng đất có khí hậu ôn hòa quanh năm, thích hợp cho mọi hoạt động nghỉ dưỡng.'}"
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Mùa du lịch lý tưởng nhất</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                        const isBest = service.area_attribute?.best_travel_months?.includes(m);
                        return (
                          <div key={m} className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all shadow-sm ${isBest ? 'bg-blue-600 text-white border-none scale-110 shadow-blue-200' : 'bg-white text-gray-300 border border-gray-50'}`}>
                            <span className="text-[8px] opacity-40 leading-none mb-0.5">TH</span>
                            {m}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] px-2 pt-4">
                      <span>Mùa mưa: Th{service.area_attribute.rainy_season?.from_month || '5'}-{service.area_attribute.rainy_season?.to_month || '10'}</span>
                      <span className="text-blue-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Tháng Đẹp</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Promotional Banner */}
            <div className="rounded-[2.5rem] overflow-hidden relative h-56 group shadow-2xl shadow-blue-100/50 mt-12 bg-gray-900 border-none">
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" alt="Promotion" />
              <div className="absolute inset-0 flex flex-col justify-center p-12 text-white">
                <Badge className="w-fit bg-blue-600 mb-4 border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1 text-white">Đặc quyền VIP</Badge>
                <h3 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-white italic">Giảm thêm 15% khi đặt qua App</h3>
                <p className="text-sm font-medium opacity-80 max-w-md text-white/80">Quét mã QR để nhận coupon giảm giá đặc biệt dành riêng cho khách hàng thân thiết của VietTravel.</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://viettravel.vn/app" className="w-full h-full" alt="QR" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white/60">Quét để tải App</p>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Card đặt chỗ & Nhà cung cấp */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">

              {/* Card đặt chỗ - Traveloka Style (White with heavy shadow) */}
              <div id="booking-card" className="bg-white rounded-[2.5rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 flex flex-col gap-2 items-end">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Xác nhận tức thì</Badge>
                </div>

                <div className="mb-8 text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Thông tin đặt chỗ</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black tracking-tighter text-gray-900">
                      {service.item_type === 'vehicle'
                        ? selectedSeats.reduce((sum, s) => sum + Number(s.price || 0), 0).toLocaleString()
                        : (quantity * (service.price || 0)).toLocaleString()
                      }đ
                    </span>
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">tổng phí</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái dịch vụ</p>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} /> <span>Còn chỗ trống</span>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={handleBookingRedirect}
                      className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-[0.98]"
                    >
                      ĐẶT CHỖ NGAY
                    </Button>
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
              </div>

              {/* Nhà cung cấp & Support */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border-4 border-white shadow-xl relative">
                    {service.provider_image ? (
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
    </div>
  );
}

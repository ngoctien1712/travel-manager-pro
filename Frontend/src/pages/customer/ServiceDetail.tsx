import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Activity,
  Award,
  Users,
  Car
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
  vehicle_attribute?: any;
  positions?: Array<{
    id_position: string;
    code_position: string;
    price: number;
    is_booked: boolean;
  }>;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

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

  const handlePrevImage = () => {
    if (!service?.media || service.media.length <= 1) return;
    const currentIndex = service.media.findIndex(m => m.url === activeImage);
    const prevIndex = (currentIndex - 1 + service.media.length) % service.media.length;
    setActiveImage(service.media[prevIndex].url);
  };

  const handleNextImage = () => {
    if (!service?.media || service.media.length <= 1) return;
    const currentIndex = service.media.findIndex(m => m.url === activeImage);
    const nextIndex = (currentIndex + 1) % service.media.length;
    setActiveImage(service.media[nextIndex].url);
  };

  const handleAddToCart = async () => {
    if (!service) return;
    try {
      await customerApi.addToCart(service.id_item, quantity, service.price);
      alert('Đã thêm vào giỏ hàng thành công!');
      navigate('/cart');
    } catch (error) {
      alert('Lỗi khi thêm vào giỏ hàng');
    }
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
    <div className="bg-[#f8fafc] min-h-screen pb-20 font-sans">
      <div className="container mx-auto px-4 lg:px-20 py-8">

        {/* Quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ChevronLeft size={16} /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* CỘT TRÁI: Hình ảnh & Thông tin chi tiết */}
          <div className="lg:col-span-7 space-y-8">

            {/* Gallery ảnh chủ đạo */}
            <div className="relative group">
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                <img
                  src={getImageUrl(activeImage)}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <Badge className="bg-[#3b82f6] text-white px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border-none shadow-sm flex items-center gap-2">
                    <Home size={14} /> {service.item_type.toUpperCase()}
                  </Badge>
                  <div className="bg-white/90 backdrop-blur rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm border border-gray-100">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-700">{service.city_name}</span>
                  </div>
                </div>
                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Bộ sưu tập (Thumbnails) */}
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  <span>BỘ SƯU TẬP ẢNH ({service.media?.length || 0})</span>
                  <button className="flex items-center gap-1 hover:text-gray-900 transition-colors">Lướt để xem thêm <ChevronRight size={12} /></button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                  {service.media?.map((m) => (
                    <button
                      key={m.id_media}
                      onClick={() => setActiveImage(m.url)}
                      className={`relative w-28 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all snap-start ${activeImage === m.url ? 'border-[#3b82f6] shadow-sm' : 'border-white hover:border-gray-200'
                        }`}
                    >
                      <img src={getImageUrl(m.url)} className="w-full h-full object-cover" alt="Thumbnail" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chi tiết dịch vụ chung */}
            <section className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <ChevronDown size={14} className="-rotate-180" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Chi tiết dịch vụ</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-10">{service.description}</p>

              {/* General Attributes */}
              {service.attribute && Object.keys(service.attribute).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(service.attribute).map(([k, v]: [string, any]) => {
                    const formatValue = (val: any): string => {
                      if (val === null || val === undefined || val === '') return '';
                      if (Array.isArray(val)) {
                        return val
                          .map(i => formatValue(i))
                          .filter(i => i !== '')
                          .join(' • ');
                      }
                      if (typeof val === 'object') {
                        const entries = Object.entries(val)
                          .map(([sk, sv]) => {
                            const formattedV = formatValue(sv);
                            return formattedV ? `${sk.replace(/_/g, ' ')}: ${formattedV}` : null;
                          })
                          .filter(Boolean);

                        // If it's a multi-line list (like timetable), join with newline-ish separator
                        return entries.length > 1 ? entries.join(' | ') : (entries[0] || '');
                      }
                      return String(val);
                    };

                    let displayValue = formatValue(v);
                    let displayKey = k.replace(/_/g, ' ');

                    if (!displayValue) return null;

                    return (
                      <div key={k} className="flex flex-col gap-1.5 p-5 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">{displayKey}</span>
                        <span className="text-gray-900 font-bold text-sm leading-tight">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 1. TOUR ATTRIBUTES */}
            {service.item_type === 'tour' && service.tour_attribute && (
              <section className="bg-white rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-sm space-y-10">
                <h3 className="text-xl font-bold flex items-center gap-3"><Calendar size={24} className="text-[#3b82f6]" /> Lịch trình & Thông tin Tour</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                    <Tag size={20} className="text-blue-500 mb-2" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Loại Tour</span>
                    <span className="font-bold text-gray-900 capitalize">{service.tour_attribute.tour_type}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                    <Clock size={20} className="text-blue-500 mb-2" />
                    <span className="text-[9px] font-black text-gray-400 uppercase mb-1">Số ngày</span>
                    <span className="font-bold text-gray-900">
                      {(() => {
                        if (service.start_at && service.end_at) {
                          const start = new Date(service.start_at);
                          const end = new Date(service.end_at);

                          // Normalize dates to midnight to count calendar days correctly
                          start.setHours(0, 0, 0, 0);
                          end.setHours(0, 0, 0, 0);

                          const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          return `${diff} ngày`;
                        }
                        if (service.tour_attribute.duration_days) return `${service.tour_attribute.duration_days} ngày`;
                        return '---';
                      })()}
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                    <Calendar size={20} className="text-blue-500 mb-2" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Khởi hành</span>
                    <span className="font-bold text-gray-900 truncate w-full">
                      {service.start_at ? new Date(service.start_at).toLocaleDateString('vi-VN') : service.tour_attribute.departure_point}
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                    <Award size={20} className="text-blue-500 mb-2" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Tiêu chuẩn</span>
                    <span className="font-bold text-gray-900">{service.tour_attribute.hotel_standard?.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {service.start_at && service.end_at && (
                  <div className="flex flex-col sm:flex-row gap-4 p-6 rounded-3xl bg-blue-50/50 border border-blue-100/50 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <Calendar size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Thời hạn Tour</p>
                        <p className="text-sm font-bold text-blue-900">
                          {new Date(service.start_at).toLocaleDateString('vi-VN')}
                          <span className="mx-2 text-blue-300">→</span>
                          {new Date(service.end_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 pr-4">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Giờ đi</p>
                        <p className="text-xs font-black text-blue-700">{new Date(service.start_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="w-px h-8 bg-blue-200/50" />
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Giờ về</p>
                        <p className="text-xs font-black text-blue-700">{new Date(service.end_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                )}

                {service.tour_attribute.meals && (
                  <div className="p-6 rounded-2xl bg-gray-50 flex justify-around items-center border border-gray-100 shadow-inner">
                    <div className="flex flex-col items-center">
                      <Utensils size={18} className="text-orange-400 mb-1" />
                      <span className="text-[10px] uppercase font-bold text-gray-400">Sáng</span>
                      <span className="text-lg font-black">{service.tour_attribute.meals.breakfast}</span>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div className="flex flex-col items-center">
                      <Utensils size={18} className="text-orange-400 mb-1" />
                      <span className="text-[10px] uppercase font-bold text-gray-400">Trưa</span>
                      <span className="text-lg font-black">{service.tour_attribute.meals.lunch}</span>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div className="flex flex-col items-center">
                      <Utensils size={18} className="text-orange-400 mb-1" />
                      <span className="text-[10px] uppercase font-bold text-gray-400">Tối</span>
                      <span className="text-lg font-black">{service.tour_attribute.meals.dinner}</span>
                    </div>
                  </div>
                )}

                {/* Itinerary Timeline */}
                <div className="space-y-8 pt-4">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest px-1 border-l-4 border-blue-500">Lịch trình chi tiết</h4>
                  {service.tour_attribute.itinerary?.map((it, idx) => (
                    <div key={idx} className="flex gap-6 group">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-blue-600 transition-colors">{it.day}</div>
                        {idx < (service.tour_attribute!.itinerary!.length - 1) && <div className="w-0.5 h-full bg-gray-100" />}
                      </div>
                      <div className="flex-1 pb-10">
                        <h5 className="font-bold text-gray-900 text-lg mb-3">{it.title}</h5>
                        <ul className="space-y-2">
                          {it.activities.map((act, i) => (
                            <li key={i} className="flex items-start gap-4 text-gray-600 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {service.tour_attribute.tour_highlights && (
                  <div className="pt-6 border-t border-gray-50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Điểm nhấn chuyến đi</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.tour_attribute.tour_highlights.map((hl, i) => (
                        <Badge key={i} variant="outline" className="px-4 py-2 rounded-xl text-gray-600 border-gray-200">✨ {hl}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 2. ACCOMMODATION ATTRIBUTES */}
            {service.item_type === 'accommodation' && service.acc_attribute && (
              <section className="bg-white rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-sm space-y-10">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold flex items-center gap-3"><Home size={24} className="text-[#3b82f6]" /> Tiện nghi lưu trú</h3>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} className={i < (service.acc_attribute!.stars || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 text-lg leading-relaxed italic border-l-4 border-blue-500 pl-8">{service.acc_attribute.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiện nghi chính</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {service.acc_attribute.amenities?.map(am => (
                        <div key={am} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <CheckCircle2 size={16} className="text-blue-500" />
                          <span className="text-xs font-bold text-gray-700 capitalize">{am.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hướng tầm nhìn</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.acc_attribute.views?.map(v => (
                        <div key={v} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
                          <Eye size={14} className="text-blue-400" /> View {v}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {service.rooms && service.rooms.length > 0 && (
                  <div className="pt-6 border-t border-gray-50 space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hạng phòng hiện có</h4>
                    {service.rooms.map(room => (
                      <div key={room.id_room} className="flex flex-col gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-blue-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900">{room.name_room}</p>
                            <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-tight mt-1"><Users size={12} /> Tối đa {room.max_guest} người</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-blue-600 tracking-tight">{room.price.toLocaleString()}đ</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase italic">mỗi đêm</p>
                          </div>
                        </div>

                        {/* Room specific attributes (Wifi, AC, etc.) */}
                        {room.attribute && Object.keys(room.attribute).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100/50">
                            {Object.entries(room.attribute).map(([attrK, attrV]) => (
                              <div key={attrK} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-100 text-[9px] font-bold text-gray-500 uppercase tracking-tight shadow-sm">
                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                {attrK.replace(/_/g, ' ')}: <span className="text-gray-900">{String(attrV)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 3. VEHICLE ATTRIBUTES */}
            {service.item_type === 'vehicle' && (
              <section className="bg-white rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-sm space-y-10">
                <h3 className="text-xl font-bold flex items-center gap-3"><Car size={24} className="text-[#3b82f6]" /> Tiện nghi & Sơ đồ xe</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                    <Tag size={20} className="text-blue-500 mb-2" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Mã xe</span>
                    <span className="font-bold text-gray-900">{service.code_vehicle}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                    <Users size={20} className="text-blue-500 mb-2" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Số chỗ</span>
                    <span className="font-bold text-gray-900">{service.max_guest} chỗ</span>
                  </div>
                  {service.vehicle_attribute && Object.entries(service.vehicle_attribute).slice(0, 2).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-5 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                      <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-[8px] mb-2 font-black uppercase">V</div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase mb-1 truncate w-full px-1">{k.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-gray-900 truncate w-full px-1">{String(v)}</span>
                    </div>
                  ))}
                </div>

                {service.positions && service.positions.length > 0 && (
                  <div className="pt-6 border-t border-gray-50 space-y-6">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sơ đồ chỗ ngồi hiện có</h4>
                      <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-100" /> Trống</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-400" /> Đang chọn</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-900" /> Đã đặt</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {service.positions.map(pos => (
                        <div
                          key={pos.id_position}
                          className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${pos.is_booked
                            ? 'bg-gray-900 text-white border-gray-900 opacity-20 cursor-not-allowed'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-blue-500 hover:bg-white cursor-pointer'
                            }`}
                        >
                          {pos.code_position}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {service.vehicle_attribute && Object.keys(service.vehicle_attribute).length > 2 && (
                  <div className="pt-6 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(service.vehicle_attribute).slice(2).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{k.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-bold text-gray-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 4. POINT OF INTEREST ATTRIBUTES (FOR TICKETS) */}
            {service.item_type === 'ticket' && service.poi_name && service.poi_type && (
              <section className="bg-white rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-sm space-y-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold flex items-center gap-3"><TicketIcon size={24} className="text-[#3b82f6]" /> Thông tin điểm đến</h3>
                    <p className="text-2xl font-black text-gray-900 tracking-tighter ml-8">{service.poi_name}</p>
                  </div>
                  {service.poi_type.rating && (
                    <div className="bg-blue-50 p-4 rounded-2xl text-center min-w-[100px] border border-blue-100">
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <span className="text-2xl font-black">{service.poi_type.rating.score}</span>
                        <Star size={16} className="fill-blue-600" />
                      </div>
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{service.poi_type.rating.reviews_count} Reviews</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Khoảng giá</p>
                        <p className="text-lg font-black text-gray-800">{service.poi_type.price_range?.level}</p>
                        <p className="text-[10px] text-gray-500 font-bold">{service.poi_type.price_range?.currency} / người</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Thời gian gợi ý</p>
                        <p className="text-sm font-bold text-gray-800 capitalize leading-tight">{service.poi_type.recommended_time?.time_of_day.join(' & ')}</p>
                        <p className="text-[10px] text-blue-500 font-black mt-1">~{service.poi_type.recommended_time?.avg_duration_minutes} phút</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hoạt động tại đây</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.poi_type.activities?.map(act => (
                          <Badge key={act} className="px-4 py-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 shadow-none font-bold">#{act}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gray-900 text-white shadow-xl relative overflow-hidden">
                      <div className="relative z-10 flex flex-col gap-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mức độ đông đúc</h4>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="opacity-60">Ngày thường:</span>
                          <Badge variant="outline" className="text-white border-white/20 px-3 uppercase text-[10px]">{service.poi_type.crowd_level?.weekday}</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="opacity-60">Cuối tuần:</span>
                          <Badge className="bg-orange-500 text-white border-none px-3 uppercase text-[10px]">{service.poi_type.crowd_level?.weekend}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phù hợp với</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {service.poi_type.suitability && Object.entries(service.poi_type.suitability).map(([k, v]) => (
                          <div key={k} className={`flex items-center gap-3 p-3 rounded-xl border ${v ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${v ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{v ? '✓' : '×'}</div>
                            <span className="text-xs font-bold uppercase tracking-tight">{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 4. AREA / GEOGRAPHY ATTRIBUTES */}
            {service.area_attribute && (
              <section className="bg-white rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-sm space-y-10">
                <div className="flex items-center gap-3">
                  <CloudSun size={24} className="text-orange-400" />
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Kinh nghiệm tại {service.area_name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kiểu khí hậu</p>
                        <p className="font-black text-gray-900">{service.area_attribute.climate_type}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nhiệt độ TB</p>
                        <p className="font-black text-gray-900">{service.area_attribute.average_temperature?.min}° - {service.area_attribute.average_temperature?.max}° {service.area_attribute.average_temperature?.unit || 'C'}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-orange-50 border border-orange-100 text-orange-900 font-bold italic text-sm leading-relaxed">
                      <Info size={16} className="mb-2" />
                      "{service.area_attribute.weather_notes?.[0]}"
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Các tháng du lịch lý tưởng</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                        const isBest = service.area_attribute?.best_travel_months?.includes(m);
                        return (
                          <div key={m} className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${isBest ? 'bg-orange-500 text-white shadow-lg shadow-orange-100 scale-105' : 'bg-gray-50 text-gray-300'}`}>
                            {m}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      <span>Mùa mưa: Tháng {service.area_attribute.rainy_season?.from_month} - {service.area_attribute.rainy_season?.to_month}</span>
                      <span className="text-orange-500">Tháng Đẹp nhất 🗸</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* CỘT PHẢI: Thẻ đặt chỗ */}
          <div className="lg:col-span-5 lg:pl-4">
            <div className="sticky top-8 space-y-6">

              <div className="bg-white rounded-[2rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 group">
                <div className="mb-8 text-center">
                  <div className="flex items-baseline justify-center gap-2 mb-1">
                    <span className="text-3xl font-black tracking-tight text-gray-900">{service.price?.toLocaleString() || '0'}đ</span>
                    <span className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.1em]">/ lượt</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Giá đã bao gồm tất cả thuế phí</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Số lượng đặt mua</label>
                    <div className="flex items-center gap-4 bg-[#F8FAFC] p-2 rounded-2xl border-2 border-transparent group-focus-within:border-blue-500 transition-all shadow-inner">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-50 flex items-center justify-center text-2xl font-black hover:bg-gray-900 hover:text-white transition-all active:scale-90"
                      >
                        -
                      </button>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="flex-1 text-center bg-transparent border-none font-black text-3xl focus-visible:ring-0 shadow-none pointer-events-none"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-50 flex items-center justify-center text-2xl font-black hover:bg-gray-900 hover:text-white transition-all active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-6 border-y border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng số tiền</span>
                    <span className="text-2xl font-black text-[#3b82f6] tracking-tight">{(quantity * (service.price || 0)).toLocaleString()}đ</span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    className="w-full h-16 rounded-[1.5rem] bg-[#3b82f6] hover:bg-blue-700 text-white font-black text-lg tracking-widest shadow-xl shadow-blue-100 transition-all border-none group relative overflow-hidden active:scale-[0.98]"
                  >
                    <span className="relative z-10">Đặt chỗ ngay</span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              </div>

              {/* Nhà cung cấp */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">ĐƠN VỊ CUNG CẤP DỊCH VỤ</p>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-gray-50 border-4 border-white shadow-2xl relative">
                    {service.provider_image ? (
                      <img src={getImageUrl(service.provider_image)} alt={service.provider_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200"><User size={40} /></div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-gray-900 leading-none mb-2">{service.provider_name || 'VietTravel Global'}</h4>
                    <a href={`tel:${service.provider_phone}`} className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 hover:border-blue-500 transition-all">
                      <Phone size={14} className="text-blue-500" /> {service.provider_phone || 'Hỗ trợ 24/7'}
                    </a>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-50 text-center">
                  <p className="text-[10px] text-gray-400 font-bold flex items-center justify-center gap-2 uppercase">
                    <MapPin size={12} className="text-blue-500" />
                    {service.area_name}, {service.city_name}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Tags chân trang */}
        <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-4 opacity-40 hover:opacity-100 transition-opacity">
          {service.tags?.map(tag => (
            <span key={tag} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">#{tag}</span>
          ))}
        </div>

      </div>
    </div>
  );
}

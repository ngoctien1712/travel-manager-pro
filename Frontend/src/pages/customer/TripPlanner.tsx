import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Wallet,
  Compass,
  Clock,
  Star,
  ArrowRight,
  Heart,
  Share2,
  Trash2,
  Info,
  Navigation,
  Sparkles,
  History,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { customerApi } from '@/api/customer.api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker as LeafletMarker, Circle as LeafletCircle, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { httpClient } from '@/api/http';

const defaultCenter: [number, number] = [16.0544, 108.2022];

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const DaNangIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45]
});

const getDestinationImage = (destination: string) => {
  const d = destination.toLowerCase();
  if (d.includes('đà nẵng')) return "https://images.unsplash.com/photo-1559592442-7e18259f63cc?q=80&w=800&auto=format&fit=crop";
  if (d.includes('hà nội')) return "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?q=80&w=800&auto=format&fit=crop";
  if (d.includes('hồ chí minh') || d.includes('sài gòn')) return "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop";
  if (d.includes('phú quốc')) return "https://images.unsplash.com/photo-1589779202435-841f888bb14c?q=80&w=800&auto=format&fit=crop";
  if (d.includes('hạ long')) return "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=800&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop";
};

export default function TripPlanner() {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDestinationCoords, setIsDestinationCoords] = useState(false);
  const [pois, setPois] = useState<any[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSavedId, setViewingSavedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [isSearchingInMap, setIsSearchingInMap] = useState(false);

  useEffect(() => {
    const initLocation = async () => {
      // 1. LẤY TỪ CACHE (TỨC THÌ)
      const cached = localStorage.getItem('lastUserLocation');
      if (cached) {
        try {
          const { lat, lng } = JSON.parse(cached);
          setCoordinates({ lat, lng });
          setIsDestinationCoords(false);
        } catch (e) { }
      }

      // 2. LẤY TỪ IP (CỰC NHANH - Dùng khi GPS chậm hoặc bị chặn)
      // Đây là giải pháp "cứu cánh" để bản đồ không bao giờ bị trống
      try {
        const ipRes = await fetch('https://ipapi.co/json/').then(res => res.json());
        if (ipRes && ipRes.latitude && ipRes.longitude) {
          const ipLoc = { lat: ipRes.latitude, lng: ipRes.longitude };
          // Chỉ cập nhật nếu chưa có cache hoặc tọa độ hiện tại chưa có
          if (!localStorage.getItem('lastUserLocation')) {
            setCoordinates(ipLoc);
          }
          setUserLocation(ipLoc);
        }
      } catch (e) {
        console.warn("Không thể lấy vị trí qua IP");
      }

      // 3. LẤY TỪ TRÌNH DUYỆT (CHÍNH XÁC NHẤT)
      getCurrentLocation();
    };

    initLocation();
    fetchSavedPlans();
  }, []);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLoc = { lat: latitude, lng: longitude };
          setUserLocation(newLoc);
          setCoordinates(newLoc);
          setIsDestinationCoords(false);
          localStorage.setItem('lastUserLocation', JSON.stringify(newLoc));
          toast.success("Đã cập nhật vị trí chính xác!");
        },
        (error) => {
          console.error("Lỗi lấy vị trí GPS:", error);
          // Nếu bị chặn, vị trí IP ở bước 2 vẫn giúp bản đồ có dữ liệu
        },
        {
          enableHighAccuracy: false, // TẮT cái này đi để load cực nhanh qua Wi-Fi/Cell
          timeout: 4000,
          maximumAge: 300000
        }
      );
    }
  };

  const fetchSavedPlans = async () => {
    try {
      const plans = await customerApi.listTripPlans();
      setSavedPlans(plans || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách kế hoạch:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDestinationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, destination: value }));
    // Khi người dùng thay đổi text, coi như tọa độ cũ không còn khớp với điểm đến mới
    setIsDestinationCoords(false);

    if (value.length > 2) {
      try {
        const data = await httpClient.get<any[]>(`/planning/suggest?q=${encodeURIComponent(value)}`);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Lỗi lấy gợi ý:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s: any) => {
    setFormData(prev => ({ ...prev, destination: s.label }));
    setCoordinates(s.coordinates);
    setIsDestinationCoords(true);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const result = await httpClient.post<any>('/planning/generate', {
        startDate: formData.startDate,
        endDate: formData.endDate,
        destination: formData.destination,
        // Chỉ gửi tọa độ nếu nó thực sự là tọa độ của điểm đến đã chọn từ gợi ý
        coordinates: isDestinationCoords ? coordinates : null
      });

      if (result.success) {
        setGeneratedPlan(result.data);
        // Cập nhật tọa độ từ backend (luôn là tọa độ chuẩn của điểm đến)
        if (result.coordinates) {
          setCoordinates(result.coordinates);
          setIsDestinationCoords(true);
        }
        // Hiển thị các điểm ăn uống, giải trí lên map
        if (result.poiMarkers) {
          setPois(result.poiMarkers);
        }
        toast.success(`Đã tạo kế hoạch! Hệ thống xác định: ${result.case}`);
      } else {
        toast.error(result.message || 'Lỗi khi tạo kế hoạch');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    try {
      setLoading(true);
      await customerApi.createTripPlan({
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget ? Number(formData.budget) : undefined,
        plan: {
          ...generatedPlan,
          coordinates: coordinates, // Lưu tọa độ vào JSON để hiển thị lại bản đồ sau này
          pois: pois // Lưu cả các điểm markers để hiển thị lại
        }
      });
      toast.success('Đã lưu kế hoạch vào danh sách của bạn!');
      fetchSavedPlans();
      setActiveTab('saved');
    } catch (error) {
      toast.error('Lỗi khi lưu kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;

    try {
      setIsSearchingInMap(true);
      const data = await httpClient.get<any[]>(`/planning/suggest?q=${encodeURIComponent(mapSearch)}`);
      if (data && data.length > 0) {
        setCoordinates(data[0].coordinates);
        setIsDestinationCoords(false);
        toast.info(`Đã tìm thấy: ${data[0].label}`);
      } else {
        toast.error("Không tìm thấy địa điểm này trên bản đồ");
      }
    } catch (error) {
      console.error("Lỗi tìm kiếm bản đồ:", error);
    } finally {
      setIsSearchingInMap(false);
    }
  };

  const getActivityIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('ăn')) return <Clock className="w-4 h-4 text-orange-500" />;
    if (t.includes('tham quan') || t.includes('khám phá')) return <Navigation className="w-4 h-4 text-green-500" />;
    return <Compass className="w-4 h-4 text-gray-400" />;
  };

  const CoffeeIcon = () => <div className="p-2 bg-orange-50 rounded-lg"><Clock className="w-4 h-4 text-orange-500" /></div>;
  const CameraIcon = () => <div className="p-2 bg-green-50 rounded-lg"><Navigation className="w-4 h-4 text-green-500" /></div>;

  const getPoiIcon = (poi: any) => {
    const category = (poi.poi_type?.poi_category || poi.poi_type?.category || '').toLowerCase();
    const name = poi.name.toLowerCase();

    // Determine icon based on category IDs (ORS) or names
    let iconUrl = 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png'; // Default marker

    const isFood = category.includes('food') || category.includes('restaurant') || name.includes('ăn') ||
      ['621', '191', '193', '115'].some(id => category.includes(id));

    const isCafe = category.includes('cafe') || name.includes('cafe') || name.includes('phê') || name.includes('trà') ||
      ['567', '564', '162'].some(id => category.includes(id));

    const isShopping = category.includes('shopping') || category.includes('shop') || name.includes('chợ') || name.includes('siêu thị') ||
      ['304', '312', '313', '305'].some(id => category.includes(id));

    const isSightseeing = category.includes('attraction') || category.includes('view') || category.includes('nature') ||
      category.includes('museum') || name.includes('quan') || name.includes('cảnh') ||
      ['518', '572', '522', '641', '642', '430'].some(id => category.includes(id));

    const isGasStation = name.includes('xăng') || name.includes('gas') || category.includes('110');
    const isPharmacy = name.includes('thuốc') || name.includes('dược') || category.includes('457') || category.includes('206');

    if (isFood) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/4300/4300180.png'; // Restaurant
    } else if (isCafe) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/3130/3130528.png'; // Cafe
    } else if (isShopping) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/2331/2331970.png'; // Shop
    } else if (isSightseeing) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/2942/2942000.png'; // Sightseeing
    } else if (isGasStation) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/3448/3448621.png'; // Fuel
    } else if (isPharmacy) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/4320/4320350.png'; // Pharmacy
    }

    return L.icon({
      iconUrl,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header section with high-quality travel background */}
      <div
        className="h-[300px] flex items-end p-8 relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(15, 23, 42, 0.9)), url("https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-6xl mx-auto w-full relative z-10 pb-8">
          <Badge className="mb-4 bg-white/20 backdrop-blur-md text-white border-none py-1 px-3">
            <Sparkles className="w-3 h-3 mr-1 text-yellow-300" /> AI Travel Planner Premium
          </Badge>
          <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Khám phá hành trình <span className="text-blue-400">hoàn hảo</span>
          </h1>
          <p className="text-slate-300 mt-2 text-lg max-w-2xl font-medium">
            Sử dụng trí tuệ nhân tạo để lên kế hoạch du lịch chi tiết chỉ trong vài giây.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
      </div>

      <div className="container mx-auto -mt-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced Tabs for better visibility */}
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-[20px] border shadow-inner w-fit">
              <TabsTrigger
                value="new"
                className="rounded-[16px] px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-slate-600 data-[state=active]:text-blue-600"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Thiết kế mới
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="rounded-[16px] px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-slate-600 data-[state=active]:text-blue-600"
              >
                <History className="w-4 h-4 mr-2" /> Lịch trình đã lưu ({savedPlans.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Side */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      Thông tin chuyến đi
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('saved')}
                      className="text-[10px] h-7 bg-white/10 hover:bg-white/20 text-blue-300 rounded-full"
                    >
                      <History className="w-3 h-3 mr-1" /> Bộ sưu tập lịch trình
                    </Button>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" /> Điểm đến
                      </label>
                      <Input
                        placeholder="Bạn muốn đi đâu?"
                        value={formData.destination}
                        onChange={handleDestinationChange}
                        name="destination"
                        className="bg-slate-50 border-none rounded-xl h-12"
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full bg-white mt-1 border rounded-xl shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                          {suggestions.map((s: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-none flex items-center gap-2"
                              onMouseDown={() => handleSelectSuggestion(s)}
                            >
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {s.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" /> Ngày đến
                        </label>
                        <Input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className="bg-slate-50 border-none rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" /> Ngày đi
                        </label>
                        <Input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className="bg-slate-50 border-none rounded-xl"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleGeneratePlan}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-xl shadow-lg shadow-blue-100 font-bold"
                    >
                      {loading ? "Đang xử lý..." : "Bắt đầu thiết kế"}
                    </Button>
                  </CardContent>
                </Card>

              </div>

              {/* Map & Result Side */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-500" /> Bản đồ khu vực
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      className="h-8 text-[10px] rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50"
                    >
                      <MapPin className="w-3 h-3 mr-1" /> Vị trí hiện tại
                    </Button>
                  </div>
                  <div style={{ height: '600px', width: '100%', borderRadius: '24px', overflow: 'hidden' }} className="shadow-inner border bg-slate-50 relative group">
                    <MapContainer
                      center={coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter}
                      zoom={coordinates ? 15 : 6}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      preferCanvas={true} // Tăng tốc độ render hàng trăm marker
                    >
                      <ChangeView
                        center={coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter}
                        zoom={coordinates ? 15 : 6}
                      />
                      <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        maxZoom={20}
                      />
                      {coordinates && (
                        <>
                          <LeafletMarker position={[coordinates.lat, coordinates.lng]} />
                          {isDestinationCoords && (
                            <LeafletCircle
                              center={[coordinates.lat, coordinates.lng]}
                              radius={10000}
                              pathOptions={{
                                color: '#3b82f6',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.1,
                                weight: 2
                              }}
                            />
                          )}
                        </>
                      )}

                      {/* Hiển thị các điểm POI ăn uống, vui chơi với icon phân loại */}
                      {pois.map((poi, idx) => (
                        <LeafletMarker
                          key={idx}
                          position={[poi.latitude, poi.longitude]}
                          icon={getPoiIcon(poi)}
                        >
                          <Popup className="rounded-xl overflow-hidden">
                            <div className="p-1">
                              <div className="font-bold text-blue-600 mb-1">{poi.name}</div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 capitalize">
                                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px]">{poi.poi_type?.poi_category || 'Địa điểm'}</Badge>
                                {poi.source && <span className="opacity-50">• {poi.source}</span>}
                              </div>
                            </div>
                          </Popup>
                        </LeafletMarker>
                      ))}
                      {userLocation && !isDestinationCoords && (
                        <LeafletMarker
                          position={[userLocation.lat, userLocation.lng]}
                          icon={L.icon({
                            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30]
                          })}
                        />
                      )}
                    </MapContainer>
                  </div>
                  {coordinates && (
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 italic">
                      <span>{isDestinationCoords ? "Vòng tròn xanh: Bán kính 10km quanh điểm đến" : "Vị trí tham khảo"}</span>
                      <span>Toạ độ: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
                {!generatedPlan ? (
                  <div className="h-full bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center opacity-60 grayscale">
                    <Compass className="w-20 h-20 text-slate-200 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-400">Chưa có lịch trình nào</h3>
                    <p className="max-w-md mt-2">Vui lòng nhập thông tin bên trái để AI bắt đầu thiết kế chuyến du lịch cho bạn</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                        <Badge className="bg-white/20 text-white mb-2 border-none">Lịch trình hoàn hảo</Badge>
                        <h2 className="text-3xl font-bold">{generatedPlan.title}</h2>
                        <div className="flex gap-4 mt-2 opacity-80 text-sm">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {generatedPlan.destination}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {generatedPlan.duration}</span>
                        </div>
                      </div>
                      <CardContent className="p-8 space-y-8">
                        {generatedPlan.itinerary.map((day: any, dIdx: number) => (
                          <div key={dIdx} className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-100 italic">
                                  {day.day}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-slate-800">Ngày {day.day}</h3>
                                  <p className="text-sm text-slate-400 font-medium">{day.date}</p>
                                </div>
                              </div>
                            </div>

                            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                              {day.activities.map((act: any, aIdx: number) => (
                                <div key={aIdx} className="relative">
                                  {/* Dot */}
                                  <div className="absolute -left-[32px] top-1 w-[14px] h-[14px] rounded-full border-4 border-white bg-blue-500 shadow-sm z-10" />

                                  <div className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all p-5 rounded-2xl border border-transparent hover:border-blue-50 group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                                      <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold">
                                        <Clock className="w-3 h-3 mr-1" /> {act.time}
                                      </Badge>
                                      <span className="text-sm font-bold text-slate-700 bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-red-500" /> {act.location}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{act.title}</h4>
                                    <p className="text-sm text-slate-500 mt-2 leading-relaxed italic">{act.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="pt-6 border-t">
                          <h4 className="font-bold mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Lưu ý & Mẹo nhỏ</h4>
                          <div className="flex flex-wrap gap-2">
                            {generatedPlan.tips?.map((tip: string, i: number) => (
                              <Badge key={i} variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-none py-1.5 px-3">
                                {tip}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button onClick={handleSavePlan} className="flex-1 rounded-xl h-12 bg-slate-900 shadow-lg shadow-slate-200">
                            {loading ? "Đang lưu..." : "Lưu lịch trình"}
                          </Button>
                          <Button variant="outline" className="rounded-xl h-12">Chia sẻ</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            {viewingSavedId ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setViewingSavedId(null); setGeneratedPlan(null); }}
                    className="flex items-center gap-2 hover:bg-slate-200"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                  </Button>
                  <h3 className="font-bold text-lg">Chi tiết lịch trình</h3>
                </div>

                {/* Simplified view for saved details - reusing the col-8 detail logic */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-12 space-y-6">
                    {/* Detailed View - this part repeats the map and itinerary cards */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h4 className="font-bold flex items-center gap-2 text-xl">
                          <Compass className="w-5 h-5 text-blue-600" /> Bản đồ hành trình
                        </h4>
                        <div className="flex gap-2 w-full md:w-auto">
                          <form onSubmit={handleMapSearch} className="relative flex-1 md:w-64">
                            <Input
                              placeholder="Tìm vị trí trên map..."
                              value={mapSearch}
                              onChange={(e) => setMapSearch(e.target.value)}
                              className="pr-10 rounded-xl h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                            />
                            <Button
                              type="submit"
                              size="icon"
                              variant="ghost"
                              disabled={isSearchingInMap}
                              className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-blue-600 rounded-xl"
                            >
                              <Navigation className={`w-4 h-4 ${isSearchingInMap ? 'animate-pulse text-blue-500' : ''}`} />
                            </Button>
                          </form>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                            className="h-10 px-4 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium whitespace-nowrap"
                          >
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" /> Vị trí hiện tại
                          </Button>
                        </div>
                      </div>
                      <div style={{ height: '400px', width: '100%', borderRadius: '24px', overflow: 'hidden' }} className="shadow-inner border bg-slate-50 relative group">
                        <MapContainer
                          center={coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter}
                          zoom={coordinates ? 15 : 6}
                          style={{ height: '100%', width: '100%' }}
                          zoomControl={false}
                          preferCanvas={true}
                        >
                          <ChangeView center={coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter} zoom={coordinates ? 15 : 6} />
                          <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                          {coordinates && (
                            <>
                              <LeafletMarker
                                position={[coordinates.lat, coordinates.lng]}
                                icon={generatedPlan?.destination?.toLowerCase().includes('đà nẵng') ? DaNangIcon : DefaultIcon}
                              >
                                <Popup>
                                  <div className="font-bold">{generatedPlan?.destination || "Điểm đến"}</div>
                                </Popup>
                              </LeafletMarker>
                              {isDestinationCoords && (
                                <LeafletCircle
                                  center={[coordinates.lat, coordinates.lng]}
                                  radius={10000}
                                  pathOptions={{
                                    color: '#3b82f6',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.1,
                                    weight: 2
                                  }}
                                />
                              )}
                            </>
                          )}

                          {/* Hiển thị các điểm POI đã lưu trong lịch trình */}
                          {pois.map((poi, idx) => (
                            <LeafletMarker
                              key={idx}
                              position={[poi.latitude, poi.longitude]}
                              icon={getPoiIcon(poi)}
                            >
                              <Popup className="rounded-xl overflow-hidden">
                                <div className="p-1">
                                  <div className="font-bold text-blue-600 mb-1">{poi.name}</div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 capitalize">
                                    <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px]">{poi.poi_type?.poi_category || 'Địa điểm'}</Badge>
                                    {poi.source && <span className="opacity-50">• {poi.source}</span>}
                                  </div>
                                </div>
                              </Popup>
                            </LeafletMarker>
                          ))}

                          {userLocation && !isDestinationCoords && (
                            <LeafletMarker
                              position={[userLocation.lat, userLocation.lng]}
                              icon={L.icon({
                                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                                iconSize: [30, 30],
                                iconAnchor: [15, 30]
                              })}
                            />
                          )}
                        </MapContainer>
                      </div>
                      {coordinates && (
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 italic">
                          <span>{isDestinationCoords ? "Vòng tròn xanh: Bán kính 10km quanh điểm đến" : "Vị trí tham khảo"}</span>
                          <span>Toạ độ: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    {generatedPlan && (
                      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
                          <h2 className="text-3xl font-bold">{generatedPlan.title}</h2>
                          <div className="flex gap-4 mt-2 opacity-80 text-sm">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {generatedPlan.destination}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {generatedPlan.duration}</span>
                          </div>
                        </div>
                        <CardContent className="p-8 space-y-8">
                          {generatedPlan.itinerary.map((day: any, dIdx: number) => (
                            <div key={dIdx} className="space-y-6">
                              <h3 className="text-xl font-bold border-b pb-2">Ngày {day.day} - {day.date}</h3>
                              <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                {day.activities.map((act: any, aIdx: number) => (
                                  <div key={aIdx} className="relative">
                                    <div className="absolute -left-[32px] top-1 w-[14px] h-[14px] rounded-full border-4 border-white bg-blue-500 shadow-sm z-10" />
                                    <div className="bg-slate-50/50 p-5 rounded-2xl">
                                      <div className="flex justify-between mb-2">
                                        <Badge className="bg-blue-50 text-blue-600 border-none font-bold">{act.time}</Badge>
                                        <span className="text-sm font-bold text-slate-700">{act.location}</span>
                                      </div>
                                      <h4 className="font-bold text-lg">{act.title}</h4>
                                      <p className="text-sm text-slate-500 mt-2 italic">{act.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {generatedPlan.tips && generatedPlan.tips.length > 0 && (
                            <div className="pt-6 border-t">
                              <h4 className="font-bold mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Lưu ý & Mẹo nhỏ</h4>
                              <div className="flex flex-wrap gap-2">
                                {generatedPlan.tips.map((tip: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="bg-yellow-50 text-yellow-700 border-none py-1.5 px-3">
                                    {tip}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedPlans.length > 0 ? (
                  savedPlans.map((plan: any) => (
                    <Card key={plan.id_trip_plan} className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[32px] bg-white flex flex-col h-full">
                      {/* Card Image Cover */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getDestinationImage(plan.destination)}
                          alt={plan.destination}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-bold py-1.5 px-3 rounded-full shadow-lg">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {plan.plan?.duration || 'Chuyến đi'}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-6">
                          <h4 className="text-2xl font-bold text-white drop-shadow-md">{plan.destination}</h4>
                        </div>
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Calendar className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</p>
                              <p className="text-sm font-semibold text-slate-700">
                                {new Date(plan.startDate).toLocaleDateString('vi-VN')} - {new Date(plan.endDate).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-xs font-bold text-slate-500 capitalize italic">
                                {plan.plan?.itinerary?.length || 0} ngày khám phá • {plan.plan?.pois?.length || 0} địa danh
                              </span>
                            </div>
                            {plan.budget && (
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Ngân sách</p>
                                <p className="text-sm font-bold text-blue-600">{Number(plan.budget).toLocaleString()}đ</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto flex gap-3">
                          <Button
                            onClick={() => {
                              setGeneratedPlan(plan.plan);
                              setCoordinates(plan.coordinates);
                              setIsDestinationCoords(!!plan.coordinates);
                              if (plan.plan?.pois) setPois(plan.plan.pois);
                              setViewingSavedId(plan.id_trip_plan);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5"
                          >
                            Xem lại hành trình
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xóa lịch trình này?')) {
                                customerApi.deleteTripPlan(plan.id_trip_plan).then(fetchSavedPlans);
                              }
                            }}
                            className="w-12 h-12 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[32px] opacity-60">
                    <History className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <h3 className="text-xl font-bold text-slate-400">Bạn chưa có lịch trình nào đã lưu</h3>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

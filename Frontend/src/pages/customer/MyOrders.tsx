import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { customerApi } from '@/api/customer.api';
import { Calendar, Clock, MapPin, Receipt, ChevronRight, CheckCircle2, AlertCircle, Search, Filter, Users } from 'lucide-react';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600';
    if (url.startsWith('http')) return url;
    return `${backendUrl}${url}`;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const result = await customerApi.listMyOrders();
        setOrders(result.items || []);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o =>
    (o.details?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.order_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const now = new Date();

  // Logic to split orders: Upcoming vs Past
  const upcomingOrders = filteredOrders.filter(order => {
    if (order.status === 'cancelled') return false;
    const serviceDate = order.details?.start_date || order.details?.booking_date || order.details?.visit_date || order.create_at;
    return new Date(serviceDate) >= now;
  });

  const pastOrders = filteredOrders.filter(order => {
    if (order.status === 'cancelled') return true;
    const serviceDate = order.details?.start_date || order.details?.booking_date || order.details?.visit_date || order.create_at;
    return new Date(serviceDate) < now;
  });

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="group overflow-hidden rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-700 bg-white p-0 relative">
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-50 relative z-10">
        {/* Left Section: Service Info */}
        <div className="p-10 flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${order.order_type === 'tour' ? 'bg-orange-50 text-orange-500' : order.order_type === 'accommodation' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {order.order_type === 'tour' ? <MapPin size={16} /> : order.order_type === 'accommodation' ? <Receipt size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <Badge className={`border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                order.status === 'pending' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                {order.order_type || 'DỊCH VỤ'}
              </Badge>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">
                #{order.order_code || order.id_order.slice(0, 8)}
              </span>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${order.status === 'confirmed' ? 'bg-emerald-500 text-white' :
              order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
              {order.status === 'confirmed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {_getStatusLabel(order.status)}
            </div>
          </div>

          <div className="flex gap-8">
            {/* Thumbnail */}
            <div className="hidden lg:block w-32 h-32 rounded-3xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
              <img
                src={getImageUrl(order.details?.thumbnail)}
                alt={order.details?.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-900 mb-6 group-hover:text-blue-600 transition-colors leading-[1.1] tracking-tight">
                {order.details?.title || 'Dịch vụ đã đặt'}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-6 border-t border-gray-50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thời gian</p>
                  <div className="flex items-center gap-2 text-gray-700 text-sm font-black">
                    <Calendar className="text-blue-500" size={14} />
                    <span>{new Date(order.details?.start_date || order.details?.booking_date || order.create_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Địa điểm</p>
                  <div className="flex items-center gap-2 text-gray-700 text-sm font-black">
                    <MapPin className="text-blue-500" size={14} />
                    <span className="truncate">{order.details?.city_name || 'Hà Nội'}</span>
                  </div>
                </div>
                <div className="space-y-1 hidden md:block">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                  <div className="flex items-center gap-2 text-gray-700 text-sm font-black">
                    <Users className="text-blue-500" size={14} />
                    <span>{order.details?.quantity || 1} {order.order_type === 'accommodation' ? 'phòng' : 'khách'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Price & Action */}
        <div className="p-10 md:w-80 bg-gray-50/30 flex flex-col justify-between items-center md:items-end text-center md:text-right gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />
          <div className="relative z-10 w-full">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 font-black">Tổng thanh toán</p>
            <div className="flex flex-col items-center md:items-end">
              <p className="text-4xl font-black text-blue-600 tracking-tighter leading-none">
                {Number(order.total_amount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] font-black text-blue-400 uppercase mt-1">Việt Nam Đồng</p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/my-orders/${order.id_order}`)}
            className="w-full h-16 rounded-[1.25rem] bg-gray-900 hover:bg-blue-600 text-white px-10 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-200 transition-all group/btn relative z-10 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">XEM CHI TIẾT <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></span>
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Receipt size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900 uppercase">Đơn đặt chỗ của tôi</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl font-bold border-gray-200">
            Quay lại Trang chủ
          </Button>
        </div>
      </div>

      <div className="container max-w-5xl px-4 py-12 space-y-12">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <Tabs defaultValue="upcoming" className="w-fit">
            <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex h-auto">
              <TabsTrigger
                value="upcoming"
                className="rounded-xl px-8 py-2.5 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
              >
                SẮP TỚI ({upcomingOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="rounded-xl px-8 py-2.5 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
              >
                LỊCH SỬ ({pastOrders.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
            <Input
              placeholder="Tìm theo tên dịch vụ, mã đơn..."
              className="h-14 pl-12 rounded-2xl bg-white border-gray-100 font-bold focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-10">
          <TabsContent value="upcoming" className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {upcomingOrders.length === 0 ? (
              <EmptyState title="Không tìm thấy đơn đặt chỗ nào" description="Thử tìm lại hoặc bắt đầu chuyến đi mới của bạn ngay thôi!" />
            ) : (
              upcomingOrders.map(order => <OrderCard key={order.id_order} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {pastOrders.length === 0 ? (
              <EmptyState title="Bạn chưa có hành trình nào" />
            ) : (
              pastOrders.map(order => <OrderCard key={order.id_order} order={order} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function _getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
}

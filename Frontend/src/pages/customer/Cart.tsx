import { useState, useEffect } from 'react';
import adLeft from '@/assets/banners/ads-left.jpg';
import adRight from '@/assets/banners/ads-right.jpg';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ShoppingCart, ShieldCheck, Lock, CreditCard, Phone } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { customerApi } from '@/api/customer.api';

interface CartData {
  items: any[];
  subtotal: number;
  discount: number;
  voucherCode?: string;
  total: number;
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600';
    if (url.startsWith('http')) return url;
    return `${backendUrl}${url}`;
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getCart();
        setCart(data);
      } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleRemoveItem = async (id: string) => {
    try {
      const updated = await customerApi.removeCartItem(id);
      setCart(updated);
    } catch (error) {
      alert('Lỗi khi xóa item');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) return <LoadingSkeleton />;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen pb-24">
        <div className="bg-white border-b h-16 flex items-center mb-12">
          <div className="container max-w-7xl px-4 flex items-center gap-4">
            <ShoppingCart size={20} className="text-blue-600" />
            <h1 className="text-xl font-black tracking-tighter text-gray-900 uppercase">Giỏ hàng</h1>
          </div>
        </div>
        <div className="container max-w-7xl px-4">
          <EmptyState
            title="Giỏ hàng trống"
            description="Hãy chọn những trải nghiệm tuyệt vời cho chuyến hành trình của bạn."
            action={{
              label: 'KHÁM PHÁ NGAY',
              onClick: () => navigate('/')
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 relative">
      {/* Full-height Skyscraper Ads */}
      <div className="hidden 2xl:block fixed left-4 top-24 bottom-8 w-48 z-0 opacity-40 hover:opacity-100 transition-all">
        <div className="h-full rounded-[2.5rem] overflow-hidden bg-white shadow-sm border relative">
          <img src={adLeft} className="w-full h-full object-cover grayscale opacity-80" alt="Travel Bag Ad" />
          <div className="absolute inset-0 bg-blue-900/30 p-8 flex flex-col justify-end text-white">
            <h4 className="text-xl font-black uppercase italic italic leading-none mb-2">TRAVEL GEAR</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Check out new arrivals</p>
          </div>
        </div>
      </div>
      <div className="hidden 2xl:block fixed right-4 top-24 bottom-8 w-48 z-0 opacity-40 hover:opacity-100 transition-all">
        <div className="h-full rounded-[2.5rem] overflow-hidden bg-white shadow-sm border relative">
          <img src={adRight} className="w-full h-full object-cover grayscale opacity-80" alt="Sea Ad" />
          <div className="absolute inset-0 bg-blue-900/30 p-8 flex flex-col justify-end text-white text-right">
            <h4 className="text-xl font-black uppercase italic italic leading-none mb-2">DEEP BLUE</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Summer cruises available</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10 transition-all duration-300">
        <div className="container max-w-7xl px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase leading-none">Giỏ hàng</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{cart.items.length} SẢN PHẨM</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="font-black text-[11px] uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl px-6 h-12">
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>

      <div className="container max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content: Items List */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[3rem] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-10">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Dịch vụ đã chọn</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đảm bảo thông tin chuẩn xác cho chuyến đi</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {cart.items.map((item, idx) => (
                    <div
                      key={item.id_cart_item || idx}
                      className="flex flex-col md:flex-row gap-8 p-8 rounded-[2rem] border border-gray-50 hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-500 group relative"
                    >
                      <div className="w-full md:w-40 h-32 rounded-3xl overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={getImageUrl(item.thumbnail)}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000"
                          alt={item.title}
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 mb-2">{item.item_type || 'DỊCH VỤ'}</Badge>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{item.title}</h3>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id_cart_item)}
                            className="p-3 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Số lượng: <span className="text-gray-900">{item.quantity}</span></span>
                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                            <span>Đơn giá: <span className="text-gray-900">{((item.price || item.base_price || 0)).toLocaleString()}đ</span></span>
                          </div>
                          <p className="font-black text-2xl text-blue-600 tracking-tighter">
                            {((item.price || item.base_price || 0) * item.quantity).toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Sub Banner Ads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 rounded-[3rem] bg-orange-500 text-white relative overflow-hidden group shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="relative z-10">
                  <Badge className="bg-white text-orange-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">GIẢM NGAY 50K</Badge>
                  <h4 className="text-3xl font-black mb-2 uppercase tracking-tighter leading-none italic">THANH TOÁN <br /> QUA MBBANK</h4>
                  <p className="text-sm opacity-80 mb-8 font-medium">Nhập mã MB50K cho đơn hàng từ 2,000,000đ khi thanh toán bằng QR MBBank.</p>
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-orange-600 rounded-2xl h-12 px-8 font-black text-xs tracking-widest uppercase">CHI TIẾT</Button>
                </div>
              </div>
              <div className="p-10 rounded-[3rem] bg-indigo-600 text-white relative overflow-hidden group shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="relative z-10">
                  <Badge className="bg-white text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">X2 ĐIỂM THƯỞNG</Badge>
                  <h4 className="text-3xl font-black mb-2 uppercase tracking-tighter leading-none italic">THÀNH VIÊN <br /> THÂN THIẾT</h4>
                  <p className="text-sm opacity-80 mb-8 font-medium">Tích lũy gấp đôi điểm thưởng TravelPro cho mọi đơn hàng trong tháng này.</p>
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600 rounded-2xl h-12 px-8 font-black text-xs tracking-widest uppercase">XEM NGAY</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Summary & Trust */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white sticky top-28">
              <div className="p-10 space-y-10">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Chi tiết thanh toán</h2>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Tạm tính:</span>
                    <span className="font-black text-gray-900">{cart.subtotal.toLocaleString()}đ</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between items-center text-sm text-emerald-600">
                      <span className="font-black uppercase text-[10px] tracking-[0.2em]">Khuyến mãi:</span>
                      <span className="font-black">-{cart.discount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Phí dịch vụ:</span>
                    <span className="font-black text-emerald-500 text-[10px] uppercase">MIỄN PHÍ</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 pt-6 border-t border-gray-50 bg-gray-50/50 -mx-10 px-10 py-6">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TỔNG CỘNG TẠM TÍNH</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-blue-600 tracking-tighter leading-none">{cart.total.toLocaleString()}</span>
                    <span className="text-lg font-black text-blue-400 italic">đ</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleCheckout}
                    className="w-full h-16 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-[0.98] uppercase tracking-widest"
                  >
                    TIẾP TỤC ĐẶT CHỖ
                  </Button>
                  <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-2xl">
                    <Lock size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Bảo mật giao dịch tuyệt đối</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sidebar Badges */}
            <div className="space-y-4">
              {[
                { icon: CreditCard, label: "Thanh toán đa dạng", desc: "Thẻ, QR, Ví điện tử, Chuyển khoản" },
                { icon: Phone, label: "Hỗ trợ khách hàng", desc: "Giải đáp mọi thắc mắc ngay tức thì" }
              ].map((marker, i) => {
                const Icon = marker.icon;
                return (
                  <Card key={i} className="flex items-center gap-5 p-6 rounded-[2.5rem] bg-white border-none shadow-sm group hover:shadow-md transition-all duration-500">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight mb-1">{marker.label}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{marker.desc}</p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Promo Banner sidebar */}
            <div className="rounded-[3rem] overflow-hidden relative h-64 group shadow-xl">
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Sidebar Ad" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent p-10 flex flex-col justify-end text-white text-center">
                <h5 className="font-black text-xl uppercase tracking-tighter leading-none mb-2">ƯU ĐÃI <br /> ĐẶT COMBO</h5>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tiết kiệm đến 30%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { customerApi } from '@/api/customer.api';
import {
  ShieldCheck, CreditCard, Banknote, Landmark,
  Wallet, ChevronLeft, ShoppingCart, Sparkles,
  User, Mail, Phone, FileText, CheckCircle2, Lock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600';
    if (url.startsWith('http')) return url;
    return `${backendUrl}${url}`;
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await customerApi.getCart();
        setCart(data);
      } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
      }
    };
    fetchCart();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const order = await customerApi.createOrder({
        travelerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        paymentMethod,
        notes: formData.notes,
      });

      // Try to process payment
      await customerApi.createPayment(order.id_order, paymentMethod);

      alert('Đơn hàng được tạo thành công!');
      navigate(`/my-orders/${order.id_order}`);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      alert('Lỗi khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <LoadingSkeleton />;

  const paymentOptions = [
    { id: 'bank', label: 'Chuyển khoản', icon: Landmark, description: 'MBBank, Vietcombank, Techcombank...' },
    { id: 'credit', label: 'Thẻ Quốc tế', icon: CreditCard, description: 'Visa, Mastercard, JCB...' },
    { id: 'cash', label: 'Tại quầy', icon: Banknote, description: 'Thanh toán tiền mặt tại văn phòng' },
    { id: 'wallet', label: 'Ví điện tử', icon: Wallet, description: 'MoMo, ZaloPay, ShopeePay' },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-2xl font-black text-[11px] uppercase tracking-widest gap-2"
          >
            <ChevronLeft size={16} /> Quay lại
          </Button>
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Thanh toán an toàn 100%</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4 max-w-7xl">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">HOÀN TẤT ĐẶT CHỖ</h1>
          <p className="text-gray-500 font-medium">Chỉ còn một bước nữa thôi để bắt đầu hành trình của bạn.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Side */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-10 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Thông tin liên hệ</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chúng tôi sẽ gửi vé điện tử qua thông tin này</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên hành khách</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="VD: Nguyen Van A"
                        className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-100 font-bold focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-100 font-bold focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="0123 456 789"
                        className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-100 font-bold focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ghi chú (Tùy chọn)</label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Yêu cầu đặc biệt..."
                        className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-100 font-bold focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Phương thức thanh toán</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lựa chọn hình thức thanh toán phù hợp nhất</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.id}
                        onClick={() => setPaymentMethod(option.id)}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 group ${paymentMethod === option.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === option.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 group-hover:text-blue-500 shadow-sm'}`}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-sm uppercase tracking-tight ${paymentMethod === option.id ? 'text-blue-900' : 'text-gray-900'}`}>{option.label}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{option.description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === option.id ? 'border-blue-600' : 'border-gray-200'}`}>
                          {paymentMethod === option.id && <div className="w-3 h-3 rounded-full bg-blue-600 animate-in zoom-in-50" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[2.5rem] bg-gray-900 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-600/20 transition-all duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={20} className="text-emerald-400" />
                  <span className="font-black text-xs uppercase tracking-widest text-emerald-400">Cam kết bảo mật</span>
                </div>
                <p className="text-sm opacity-60 font-medium">Bằng việc nhấn "Thanh toán", bạn đồng ý với các Điều khoản & Chính sách của VietTravel.</p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full md:w-64 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg relative z-10 shadow-xl shadow-blue-900 transition-all active:scale-[0.98]"
              >
                {loading ? 'ĐANG XỬ LÝ...' : 'THANH TOÁN NGAY'}
              </Button>
            </div>
          </div>

          {/* Summary Side */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white sticky top-24">
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Chi tiết đơn hàng</h3>
                </div>

                <div className="space-y-6">
                  {cart.items.map((item: any) => (
                    <div key={item.id_cart_item} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-50 shadow-sm relative">
                        <img
                          src={getImageUrl(item.thumbnail)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt={item.title}
                        />
                        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">x{item.quantity} </div>
                      </div>
                      <div className="flex flex-col justify-between py-1">
                        <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-tight uppercase tracking-tight">{item.title}</h4>
                        <p className="text-[11px] font-black text-blue-600">
                          {((item.price || item.base_price || 0) * item.quantity).toLocaleString()}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-gray-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tạm tính</span>
                    <span className="font-black text-sm">{cart.subtotal.toLocaleString()}đ</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600">
                      <span className="text-[10px] font-black uppercase tracking-widest">Giảm giá</span>
                      <span className="font-black text-sm">-{cart.discount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phí dịch vụ</span>
                    <span className="font-black text-xs text-emerald-500">MIỄN PHÍ</span>
                  </div>

                  <div className="pt-6 border-t border-gray-50 mt-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TỔNG THANH TOÁN</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-blue-600 tracking-tighter">{cart.total.toLocaleString()}</span>
                        <span className="text-sm font-black text-blue-400 italic">đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-[9px] font-black text-emerald-700 uppercase leading-tight tracking-widest">Ưu đãi độc quyền. Đã áp dụng mã giảm giá thành viên!</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

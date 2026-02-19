import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { customerApi } from '@/api/customer.api';

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
      
      alert('Đơn hàng được tạo và thanh toán thành công!');
      navigate(`/my-orders/${order.id_order}`);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      alert('Lỗi khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <LoadingSkeleton />;
  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="mb-4">Giỏ hàng trống</p>
          <Button onClick={() => navigate('/services')}>
            Quay lại mua sắm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Thông tin khách hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Họ và tên</label>
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Chuyển khoản ngân hàng</SelectItem>
                  <SelectItem value="credit">Thẻ tín dụng/ghi nợ</SelectItem>
                  <SelectItem value="alepay">AlepayPayment</SelectItem>
                  <SelectItem value="cash">Thanh toán tại quầy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-semibold mb-1">Ghi chú thêm (tùy chọn)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Ghi chú thêm..."
                className="w-full p-3 border rounded-lg"
                rows={4}
              />
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Button>
          </form>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-3 border-b pb-4 mb-4 max-h-96 overflow-y-auto">
              {cart.items.map((item: any) => (
                <div key={item.id_cart_item} className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-600">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {((item.price || item.base_price || 0) * item.quantity).toLocaleString()}đ
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{cart.subtotal.toLocaleString()}đ</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{cart.discount.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{cart.total.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

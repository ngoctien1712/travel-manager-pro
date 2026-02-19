import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
      <div className="container mx-auto py-8">
        <EmptyState 
          title="Giỏ hàng trống"
          action={
            <Button onClick={() => navigate('/services')}>
              Tiếp tục mua sắm
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {cart.items.map((item, idx) => (
              <div 
                key={item.id_cart_item || idx}
                className="flex gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Ảnh</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.quantity} x {((item.price || item.base_price || 0)).toLocaleString()}đ</p>
                  <p className="font-semibold mt-1">
                    {((item.price || item.base_price || 0) * item.quantity).toLocaleString()}đ
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id_cart_item)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-3 border-b pb-4 mb-4">
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

            <div className="mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{cart.total.toLocaleString()}đ</span>
              </div>
            </div>

            <Button 
              onClick={handleCheckout}
              className="w-full h-12 text-lg"
            >
              Tiến hành thanh toán
            </Button>
            
            <button
              onClick={() => navigate('/services')}
              className="w-full mt-2 py-2 text-center text-blue-600 hover:text-blue-700"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

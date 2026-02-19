import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import { customerApi } from '@/api/customer.api';

interface ServiceDetail {
  id_item: string;
  title: string;
  item_type: string;
  price?: number;
  attribute?: any;
  media?: Array<{ id_media: string; type: string; url: string }>;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getServiceDetail(id!);
        setService(data);
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

  const handleAddToCart = async () => {
    if (!service) return;
    try {
      await customerApi.addToCart(service.id_item, quantity, service.price);
      alert('Đã thêm vào giỏ hàng');
      navigate('/cart');
    } catch (error) {
      alert('Lỗi khi thêm vào giỏ hàng');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingSkeleton />;
  if (!service) return <ErrorState message="Không tìm thấy dịch vụ" />;

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Quay lại
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center mb-4">
            <span className="text-gray-400">Ảnh chính</span>
          </div>
          {service.media && service.media.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {service.media.map((m) => (
                <div key={m.id_media} className="bg-gray-200 rounded h-20 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Ảnh</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm mb-2">
              {service.item_type}
            </span>
            <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
            {service.attribute && (
              <p className="text-gray-600">{JSON.stringify(service.attribute)}</p>
            )}
          </div>

          <div className="border-y py-6 mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {service.price?.toLocaleString()}đ
            </div>
            <p className="text-gray-600">Giá cho mỗi dịch vụ</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Số lượng</label>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center"
              />
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-lg font-semibold mb-2">
              Tổng: {(quantity * (service.price || 0)).toLocaleString()}đ
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleAddToCart}
              className="flex-1 h-12 text-lg"
            >
              Thêm vào giỏ hàng
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-12"
            >
              Yêu thích
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Mô tả dịch vụ</h2>
        <div className="prose">
          <p>Chi tiết sẽ được cập nhật từ attribute của dịch vụ.</p>
          {service.attribute && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(service.attribute, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

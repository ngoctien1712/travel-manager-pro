import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { customerApi } from '@/api/customer.api';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const result = await customerApi.listServices(filters);
        setServices(result.items);
        setError(null);
      } catch (err) {
        setError('Lỗi khi tải danh sách dịch vụ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [filters]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFilters = {
      ...filters,
      q: (formData.get('q') as string) || '',
    };
    setFilters(newFilters);
    const nextParams: Record<string, string> = {};
    if (newFilters.q) nextParams.q = newFilters.q;
    if (newFilters.type) nextParams.type = newFilters.type;
    if (newFilters.city) nextParams.city = newFilters.city;
    if (newFilters.minPrice != null) nextParams.minPrice = String(newFilters.minPrice);
    if (newFilters.maxPrice != null) nextParams.maxPrice = String(newFilters.maxPrice);
    setSearchParams(nextParams);
  };

  const handleAddToCart = async (serviceId: string, price: number) => {
    try {
      await customerApi.addToCart(serviceId, 1, price);
      alert('Đã thêm vào giỏ hàng');
    } catch (error) {
      alert('Lỗi khi thêm vào giỏ hàng');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingSkeleton />;
  if (services.length === 0) return <EmptyState title="Không tìm thấy dịch vụ nào" />;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Danh sách dịch vụ</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <Input
            name="q"
            placeholder="Tìm kiếm dịch vụ..."
            defaultValue={filters.q}
            className="flex-1 min-w-[200px]"
          />
          <Select value={filters.type || ''} onValueChange={(val) => setFilters({ ...filters, type: val })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Loại dịch vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              <SelectItem value="tour">Tour</SelectItem>
              <SelectItem value="accommodation">Chỗ ở</SelectItem>
              <SelectItem value="vehicle">Phương tiện</SelectItem>
              <SelectItem value="ticket">Vé</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id_item} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Ảnh dịch vụ</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 truncate">{service.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.item_type}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-blue-600">
                  {service.price?.toLocaleString()}đ
                </span>
                <span className="px-2 py-1 bg-gray-100 text-xs rounded">{service.item_type}</span>
              </div>
              <div className="flex gap-2">
                <Link to={`/services/${service.id_item}`} className="flex-1">
                  <Button variant="outline" className="w-full">Xem chi tiết</Button>
                </Link>
                <Button 
                  onClick={() => handleAddToCart(service.id_item, service.price || 0)}
                  className="flex-1"
                >
                  Thêm giỏ
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

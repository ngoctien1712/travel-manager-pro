import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customerApi } from '@/api/customer.api';

export default function TripPlanner() {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const plan = await customerApi.createTripPlan({
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget ? Number(formData.budget) : undefined,
      });
      setGeneratedPlan(plan);
    } catch (error) {
      alert('Lỗi khi tạo kế hoạch chuyến đi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Lập kế hoạch chuyến đi</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Chi tiết chuyến đi</h2>
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Địa điểm</label>
                <Input
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Hà Nội, Đà Nẵng..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Ngày bắt đầu</label>
                <Input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Ngày kết thúc</label>
                <Input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Ngân sách (VND)</label>
                <Input
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="Nhập ngân sách (tùy chọn)"
                />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Đang tạo kế hoạch...' : 'Tạo kế hoạch'}
              </Button>
            </form>
          </div>
        </div>

        {/* Plan Display */}
        <div className="lg:col-span-2">
          {!generatedPlan ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-600 mb-4">Điền thông tin ở bên trái để tạo kế hoạch chuyến đi</p>
              <p className="text-gray-400 text-sm">Hệ thống sẽ gợi ý các dịch vụ phù hợp với sở thích du lịch của bạn</p>
            </div>
          ) : (
            <div>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-2">{generatedPlan.destination}</h2>
                <p className="text-gray-600">
                  {new Date(generatedPlan.startDate).toLocaleDateString('vi-VN')} - {new Date(generatedPlan.endDate).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {generatedPlan.days.length} ngày {generatedPlan.days.length - 1} đêm
                </p>
              </div>

              <div className="space-y-4">
                {generatedPlan.days.map((day: any) => (
                  <div key={day.dayNumber} className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-bold text-lg mb-4">Ngày {day.dayNumber}</h3>
                    <div className="space-y-3">
                      {day.activities.map((activity: any, idx: number) => (
                        <div key={idx} className="flex gap-4 pb-3 border-b last:border-b-0">
                          <div className="text-blue-600 font-semibold min-w-fit">{activity.time}</div>
                          <div className="flex-1">
                            <p className="font-semibold">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

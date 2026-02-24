import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geographyApi } from '@/api/geography.api';
import { ownerGeographyApi, type OwnerProvider } from '@/api/owner-geography.api';
import type { Country, City, Area } from '@/types/dto';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServiceList = ({ providerId }: { providerId: string }) => {
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['owner', 'provider-services', providerId],
    queryFn: () => ownerGeographyApi.listMyBookableItems(providerId),
  });
  const services = servicesData?.data ?? [];

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (services.length === 0) return <span className="text-xs text-muted-foreground italic">Chưa có dịch vụ</span>;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {services.map((s: any) => (
        <Link
          key={s.id}
          to={`/owner/services/${s.id}`}
          className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs hover:bg-secondary/80 transition-colors"
        >
          {s.title} <ExternalLink className="h-3 w-3" />
        </Link>
      ))}
    </div>
  );
};

export const MyProviders = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [areaId, setAreaId] = useState('');

  // Area Selection States
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');

  const { data: providersData } = useQuery({
    queryKey: ['owner', 'providers'],
    queryFn: () => ownerGeographyApi.getMyProviders(),
  });
  const providers = providersData?.data ?? [];

  const { data: myAreasData } = useQuery({
    queryKey: ['owner', 'area-ownerships'],
    queryFn: () => ownerGeographyApi.getMyAreaOwnerships(),
  });
  const myAreas = myAreasData?.data ?? [];

  const { data: countriesData } = useQuery({
    queryKey: ['geography', 'countries'],
    queryFn: () => geographyApi.listCountries(),
  });
  const countries = countriesData?.data ?? [];

  // Default to Vietnam when countries loaded
  useState(() => {
    if (countries.length > 0 && !countryId) {
      const vn = countries.find(c => c.code === 'VN');
      if (vn) setCountryId(vn.id);
    }
  });

  // Effect to set default VN when countries data changes
  useEffect(() => {
    if (countries.length > 0 && !countryId) {
      const vn = countries.find(c => c.code === 'VN');
      if (vn) setCountryId(vn.id);
    }
  }, [countries, countryId]);

  const { data: citiesData } = useQuery({
    queryKey: ['geography', 'cities', countryId],
    queryFn: () => geographyApi.listCities(countryId),
    enabled: !!countryId,
  });
  const cities = citiesData?.data ?? [];

  const { data: areasData } = useQuery({
    queryKey: ['geography', 'areas', cityId],
    queryFn: () => geographyApi.listAreas(cityId, 'active'),
    enabled: !!cityId,
  });
  const areas = areasData?.data ?? [];

  const alreadyRequestedAreas = new Set(myAreas.map((a: any) => a.areaId));

  const createMut = useMutation({
    mutationFn: (d: FormData) => ownerGeographyApi.createProvider(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'providers'] });
      setCreateOpen(false);
      setName('');
      setError('');
      setPhone('');
      setImageFile(null);
      setAreaId('');
      setCountryId('');
      setCityId('');
    },
    onError: (err: any) => {
      setError(err.message || 'Tạo nhà cung cấp thất bại');
    },
  });


  return (
    <>
      <PageHeader
        title="Nhà cung cấp"
        description="Tạo và quản lý các nhà cung cấp dịch vụ trong khu vực đã được duyệt"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách nhà cung cấp</CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Tạo nhà cung cấp
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Thành phố</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chưa có nhà cung cấp. Nhấn &quot;Tạo nhà cung cấp&quot; và chọn tên + khu vực (đã duyệt).
                  </TableCell>
                </TableRow>
              )}
              {providers.map((p: OwnerProvider) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setExpandedProviders(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      >
                        {expandedProviders[p.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      {p.image && (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${p.image}`}
                          alt={p.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {expandedProviders[p.id] && <ServiceList providerId={p.id} />}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>
                    {p.areaName} ({p.countryName})
                  </TableCell>
                  <TableCell>{p.cityName}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {p.status === 'active' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhà cung cấp</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div>
              <Label>Tên nhà cung cấp</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Công ty Du lịch A"
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0123456789"
              />
            </div>
            <div>
              <Label>Hình ảnh</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label>Quốc gia</Label>
              <Select value={countryId} onValueChange={(v) => { setCountryId(v); setCityId(''); setAreaId(''); }}>
                <SelectTrigger><SelectValue placeholder="Chọn quốc gia" /></SelectTrigger>
                <SelectContent>
                  {countries.map((c: Country) => <SelectItem key={c.id} value={c.id}>{c.name ?? c.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thành phố</Label>
              <Select value={cityId} onValueChange={(v) => { setCityId(v); setAreaId(''); }} disabled={!countryId}>
                <SelectTrigger><SelectValue placeholder="Chọn thành phố" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c: City) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Khu vực</Label>
              <Select value={areaId} onValueChange={setAreaId} disabled={!cityId}>
                <SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a: Area) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} {alreadyRequestedAreas.has(a.id) ? '(đã đăng ký)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button
              onClick={() => {
                if (name && areaId && phone) {
                  const formData = new FormData();
                  formData.append('name', name);
                  formData.append('areaId', areaId);
                  formData.append('phone', phone);
                  if (imageFile) formData.append('image', imageFile);
                  createMut.mutate(formData);
                }
              }}
              disabled={!name || !areaId || !phone || createMut.isPending}
            >
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

    </>
  );
};

export default MyProviders;

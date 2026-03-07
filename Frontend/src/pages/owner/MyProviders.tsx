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
import { Plus, Loader2, ChevronDown, ChevronRight, ExternalLink, Mail, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
          key={s.idItem}
          to={`/owner/services/${s.idItem}`}
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
  const [email, setEmail] = useState('');
  const [fanpage, setFanpage] = useState('');
  const [serviceType, setServiceType] = useState<'tour' | 'accommodation' | 'vehicle'>('tour');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [areaId, setAreaId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

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
      setEmail('');
      setFanpage('');
      setServiceType('tour');
      setImageFile(null);
      setAreaId('');
      setCountryId('');
      setCityId('');
      setBankName('');
      setBankAccountNumber('');
      setBankAccountName('');
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
                <TableHead>Loại dịch vụ</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Khu vực</TableHead>
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
                      {p.legalDocuments && p.legalDocuments.length > 0 && (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${p.legalDocuments[0]}`}
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
                  <TableCell>
                    <Badge variant="outline">
                      {p.serviceType === 'tour' ? 'Tour du lịch' : p.serviceType === 'accommodation' ? 'Lưu trú' : 'Phương tiện'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1"><span className="font-semibold w-8">SĐT:</span> {p.phone}</div>
                      {p.email && <div className="flex items-center gap-1"><span className="font-semibold w-8">Mail:</span> {p.email}</div>}
                      {p.fanpage && (
                        <a href={p.fanpage} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Link liên hệ
                        </a>
                      )}
                      {(p.bankName || p.bankAccountNumber) && (
                        <div className="pt-2 border-t mt-2">
                          <div className="font-bold text-[10px] text-muted-foreground uppercase">Tài khoản ngân hàng</div>
                          <div className="text-[10px]">{p.bankName} - {p.bankAccountNumber}</div>
                          <div className="text-[10px] font-medium">{p.bankAccountName}</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{p.areaName}</div>
                    <div className="text-xs text-muted-foreground">{p.cityName}, {p.countryName}</div>
                  </TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email liên hệ</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Fanpage / Website</Label>
                <Input
                  value={fanpage}
                  onChange={(e) => setFanpage(e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
            <div>
              <Label>Loại dịch vụ cung cấp</Label>
              <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tour">Tour du lịch</SelectItem>
                  <SelectItem value="accommodation">Chỗ ở (Khách sạn, Homestay...)</SelectItem>
                  <SelectItem value="vehicle">Phương tiện đi lại</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hình ảnh</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên ngân hàng</Label>
                <Input
                  placeholder="Ví dụ: MB Bank, Vietcombank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Số tài khoản</Label>
                <Input
                  placeholder="Nhập số tài khoản"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Tên chủ tài khoản</Label>
              <Input
                placeholder="NHẬP TÊN KHÔNG DẤU"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
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
                if (name && areaId && phone && serviceType) {
                  const formData = new FormData();
                  formData.append('name', name);
                  formData.append('areaId', areaId);
                  formData.append('phone', phone);
                  formData.append('email', email);
                  formData.append('fanpage', fanpage);
                  formData.append('serviceType', serviceType);
                  formData.append('bankName', bankName);
                  formData.append('bankAccountNumber', bankAccountNumber);
                  formData.append('bankAccountName', bankAccountName);
                  if (imageFile) formData.append('images', imageFile);
                  createMut.mutate(formData);
                }
              }}
              disabled={!name || !areaId || !phone || !serviceType || createMut.isPending}
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

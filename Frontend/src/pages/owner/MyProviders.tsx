import { useState } from 'react';
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
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceProviderId, setServiceProviderId] = useState('');
  const [itemType, setItemType] = useState<'tour' | 'accommodation' | 'vehicle' | 'ticket'>('tour');
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState<string>('');

  // Area Selection States
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');

  // Extra fields for service types
  const [tourGuideLang, setTourGuideLang] = useState('Tiếng Việt');
  const [tourStart, setTourStart] = useState('');
  const [tourEnd, setTourEnd] = useState('');
  const [accAddress, setAccAddress] = useState('');
  const [ticketKind, setTicketKind] = useState('');

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

  const createServiceMut = useMutation({
    mutationFn: (d: {
      providerId: string;
      itemType: 'tour' | 'accommodation' | 'vehicle' | 'ticket';
      title: string;
      price?: number;
      extraData?: any;
    }) => ownerGeographyApi.createBookableItem(d),
    onSuccess: () => {
      setServiceOpen(false);
      setServiceProviderId('');
      setServiceTitle('');
      setServicePrice('');
      setTourGuideLang('Tiếng Việt');
      setTourStart('');
      setTourEnd('');
      setAccAddress('');
      setTicketKind('');
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
            <Button variant="outline" onClick={() => setServiceOpen(true)} disabled={providers.length === 0}>
              Tạo dịch vụ
            </Button>
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

      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo dịch vụ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nhà cung cấp</Label>
              <Select value={serviceProviderId} onValueChange={setServiceProviderId}>
                <SelectTrigger><SelectValue placeholder="Chọn nhà cung cấp" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p: OwnerProvider) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.areaName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại dịch vụ</Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as 'tour' | 'accommodation' | 'vehicle' | 'ticket')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tour">Tour</SelectItem>
                  <SelectItem value="accommodation">Lưu trú</SelectItem>
                  <SelectItem value="vehicle">Phương tiện</SelectItem>
                  <SelectItem value="ticket">Vé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tên dịch vụ</Label>
              <Input value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} placeholder="Ví dụ: Tour Hạ Long 1 ngày" />
            </div>
            <div>
              <Label>Giá (VNĐ)</Label>
              <Input type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="0" />
            </div>

            {itemType === 'tour' && (
              <div className="grid gap-4 p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-semibold">Thông tin Tour</p>
                <div>
                  <Label>Ngôn ngữ hướng dẫn</Label>
                  <Input value={tourGuideLang} onChange={(e) => setTourGuideLang(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Bắt đầu</Label>
                    <Input type="datetime-local" value={tourStart} onChange={(e) => setTourStart(e.target.value)} />
                  </div>
                  <div>
                    <Label>Kết thúc</Label>
                    <Input type="datetime-local" value={tourEnd} onChange={(e) => setTourEnd(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {itemType === 'accommodation' && (
              <div className="grid gap-4 p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-semibold">Thông tin Lưu trú</p>
                <div>
                  <Label>Địa chỉ cụ thể</Label>
                  <Input value={accAddress} onChange={(e) => setAccAddress(e.target.value)} placeholder="Số nhà, tên đường..." />
                </div>
              </div>
            )}

            {itemType === 'ticket' && (
              <div className="grid gap-4 p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-semibold">Thông tin Vé</p>
                <div>
                  <Label>Loại vé</Label>
                  <Input value={ticketKind} onChange={(e) => setTicketKind(e.target.value)} placeholder="Vé tham quan, vé tàu..." />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceOpen(false)}>Hủy</Button>
            <Button
              onClick={() => {
                if (serviceProviderId && serviceTitle) {
                  let extraData = {};
                  if (itemType === 'tour') {
                    extraData = { guideLanguage: tourGuideLang, startAt: tourStart, endAt: tourEnd };
                  } else if (itemType === 'accommodation') {
                    extraData = { address: accAddress };
                  } else if (itemType === 'ticket') {
                    extraData = { ticketKind };
                  }

                  createServiceMut.mutate({
                    providerId: serviceProviderId,
                    itemType,
                    title: serviceTitle,
                    price: servicePrice ? Number(servicePrice) : undefined,
                    extraData
                  });
                }
              }}
              disabled={!serviceProviderId || !serviceTitle || createServiceMut.isPending}
            >
              {createServiceMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tạo dịch vụ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyProviders;

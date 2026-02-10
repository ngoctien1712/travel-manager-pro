import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerGeographyApi, type OwnerProvider } from '@/api/owner-geography.api';
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
import { Plus, Loader2 } from 'lucide-react';

export const MyProviders = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceProviderId, setServiceProviderId] = useState('');
  const [itemType, setItemType] = useState<'tour' | 'accommodation' | 'vehicle' | 'ticket'>('tour');
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState<string>('');

  const { data: providersData } = useQuery({
    queryKey: ['owner', 'providers'],
    queryFn: () => ownerGeographyApi.getMyProviders(),
  });
  const providers = providersData?.data ?? [];

  const { data: areasData } = useQuery({
    queryKey: ['owner', 'area-ownerships'],
    queryFn: () => ownerGeographyApi.getMyAreaOwnerships(),
  });
  const myAreas = areasData?.data ?? [];
  const approvedAreas = myAreas.filter((a: { status: string }) => a.status === 'active');

  const createMut = useMutation({
    mutationFn: (d: { name: string; areaId: string }) => ownerGeographyApi.createProvider(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'providers'] });
      setCreateOpen(false);
      setName('');
      setAreaId('');
    },
  });

  const createServiceMut = useMutation({
    mutationFn: (d: { providerId: string; itemType: 'tour' | 'accommodation' | 'vehicle' | 'ticket'; title: string; price?: number }) =>
      ownerGeographyApi.createBookableItem({ ...d, price: d.price || undefined }),
    onSuccess: () => {
      setServiceOpen(false);
      setServiceProviderId('');
      setServiceTitle('');
      setServicePrice('');
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
            <Button onClick={() => setCreateOpen(true)} disabled={approvedAreas.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Tạo nhà cung cấp
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {approvedAreas.length === 0 && (
            <p className="text-muted-foreground text-sm mb-4">
              Bạn cần có ít nhất một khu vực được admin duyệt (trạng thái &quot;Đã duyệt&quot;) trước khi tạo nhà cung cấp. Vào mục &quot;Khu vực của tôi&quot; để đăng ký và chờ duyệt.
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Thành phố</TableHead>
                <TableHead>Quốc gia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Chưa có nhà cung cấp. Nhấn &quot;Tạo nhà cung cấp&quot; và chọn tên + khu vực (đã duyệt).
                  </TableCell>
                </TableRow>
              )}
              {providers.map((p: OwnerProvider) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.areaName}</TableCell>
                  <TableCell>{p.cityName}</TableCell>
                  <TableCell>{p.countryName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhà cung cấp</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Tên nhà cung cấp</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Công ty Du lịch A"
              />
            </div>
            <div>
              <Label>Khu vực (đã duyệt)</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                <SelectContent>
                  {approvedAreas.map((a: { id: string; areaId: string; areaName: string; cityName: string }) => (
                    <SelectItem key={a.areaId} value={a.areaId}>
                      {a.areaName} ({a.cityName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button
              onClick={() => name && areaId && createMut.mutate({ name, areaId })}
              disabled={!name || !areaId || createMut.isPending}
            >
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label>Giá (tuỳ chọn)</Label>
              <Input type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceOpen(false)}>Hủy</Button>
            <Button
              onClick={() => serviceProviderId && serviceTitle && createServiceMut.mutate({
                providerId: serviceProviderId,
                itemType,
                title: serviceTitle,
                price: servicePrice ? Number(servicePrice) : undefined,
              })}
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

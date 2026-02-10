import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geographyApi } from '@/api/geography.api';
import { ownerGeographyApi, type AreaOwnership } from '@/api/owner-geography.api';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đã duyệt',
  inactive: 'Từ chối',
};

export const MyAreas = () => {
  const queryClient = useQueryClient();
  const [requestOpen, setRequestOpen] = useState(false);
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [areaId, setAreaId] = useState('');

  const { data: myData } = useQuery({
    queryKey: ['owner', 'area-ownerships'],
    queryFn: () => ownerGeographyApi.getMyAreaOwnerships(),
  });
  const myAreas = myData?.data ?? [];

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

  const requestMut = useMutation({
    mutationFn: (aid: string) => ownerGeographyApi.requestAreaOwnership(aid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'area-ownerships'] });
      setRequestOpen(false);
      setCountryId('');
      setCityId('');
      setAreaId('');
    },
  });

  const alreadyRequested = new Set(myAreas.map((a: AreaOwnership) => a.areaId));

  return (
    <>
      <PageHeader
        title="Khu vực của tôi"
        description="Đăng ký và quản lý các khu vực bạn được phép kinh doanh"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách khu vực đã đăng ký</CardTitle>
          <Button onClick={() => setRequestOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Đăng ký thêm khu vực
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khu vực</TableHead>
                <TableHead>Thành phố</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myAreas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Bạn chưa đăng ký khu vực nào. Nhấn Đăng ký thêm khu vực và chọn khu vực, sau đó chờ admin duyệt.
                  </TableCell>
                </TableRow>
              )}
              {myAreas.map((a: AreaOwnership) => (
                <TableRow key={a.id}>
                  <TableCell>{a.areaName}</TableCell>
                  <TableCell>{a.cityName}</TableCell>
                  <TableCell>{a.countryName}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'active' ? 'default' : a.status === 'pending' ? 'secondary' : 'outline'}>
                      {statusLabels[a.status] ?? a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký khu vực kinh doanh</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                    <SelectItem key={a.id} value={a.id} disabled={alreadyRequested.has(a.id)}>
                      {a.name} {alreadyRequested.has(a.id) ? '(đã đăng ký)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Hủy</Button>
            <Button
              onClick={() => areaId && requestMut.mutate(areaId)}
              disabled={!areaId || requestMut.isPending}
            >
              {requestMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyAreas;

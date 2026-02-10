import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geographyApi, adminGeographyApi } from '@/api/geography.api';
import type { Country, City, Area, PointOfInterest } from '@/types/dto';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, Loader2, Globe } from 'lucide-react';

const emptyAttribute = '{\n  "climate_type": "",\n  "average_temperature": { "min": 0, "max": 0, "unit": "celsius" },\n  "best_travel_months": []\n}';
const emptyPoiType = '{\n  "poi_category": "attraction",\n  "poi_sub_type": "",\n  "rating": { "score": 0, "reviews_count": 0 },\n  "tags": []\n}';

export const AdminGeography = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('countries');
  const [countryForm, setCountryForm] = useState<{ code: string; name: string; nameVi: string }>({ code: '', name: '', nameVi: '' });
  const [cityForm, setCityForm] = useState<{ countryId: string; name: string; nameVi: string }>({ countryId: '', name: '', nameVi: '' });
  const [areaForm, setAreaForm] = useState<{ countryId: string; cityId: string; name: string; attribute: string; status: string }>({ countryId: '', cityId: '', name: '', attribute: emptyAttribute, status: 'active' });
  const [poiForm, setPoiForm] = useState<{ countryId: string; cityId: string; areaId: string; name: string; poiType: string }>({ countryId: '', cityId: '', areaId: '', name: '', poiType: emptyPoiType });
  const [createOpen, setCreateOpen] = useState<'country' | 'city' | 'area' | 'poi' | null>(null);
  const [editRow, setEditRow] = useState<{ type: string; id: string; row: Record<string, unknown> } | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ type: string; id: string; name: string } | null>(null);

  const { data: countriesData } = useQuery({
    queryKey: ['geography', 'countries'],
    queryFn: () => geographyApi.listCountries(),
  });
  const countries = countriesData?.data ?? [];

  const citiesCountryId = activeTab === 'cities' ? cityForm.countryId : activeTab === 'areas' ? areaForm.countryId : activeTab === 'pois' ? poiForm.countryId : '';
  const { data: citiesData } = useQuery({
    queryKey: ['geography', 'cities', citiesCountryId],
    queryFn: () => geographyApi.listCities(citiesCountryId),
    enabled: !!citiesCountryId,
  });
  const citiesRaw = citiesData?.data ?? [];
  const cities = useMemo(() => {
    const raw = Array.isArray(citiesRaw) ? citiesRaw : [];
    return raw
      .map((c: City & Record<string, unknown>) => {
        const id = (c?.id && String(c.id) !== 'undefined'
          ? c.id
          : c?.idCity ?? c?.id_city) as string | undefined;
        const sid = id != null ? String(id) : '';
        if (!sid) return null;
        return { ...c, id: sid } as City;
      })
      .filter((c): c is City => c != null);
  }, [citiesRaw]);

  const areasCityId = activeTab === 'areas' ? areaForm.cityId : activeTab === 'pois' ? poiForm.cityId : '';
  const { data: areasData } = useQuery({
    queryKey: ['geography', 'areas', areasCityId],
    queryFn: () => geographyApi.listAreas(areasCityId, 'all'),
    enabled: !!areasCityId,
  });
  const areasRaw = areasData?.data ?? [];
  const areas = useMemo(() => {
    const raw = Array.isArray(areasRaw) ? areasRaw : [];
    return raw
      .map((a: Area & Record<string, unknown>) => {
        const id = (a?.id && String(a.id) !== 'undefined'
          ? a.id
          : a?.idArea ?? a?.id_area) as string | undefined;
        const sid = id != null ? String(id) : '';
        if (!sid) return null;
        return { ...a, id: sid } as Area;
      })
      .filter((a): a is Area => a != null);
  }, [areasRaw]);

  const { data: poisData } = useQuery({
    queryKey: ['geography', 'pois', poiForm.areaId],
    queryFn: () => geographyApi.listPois(poiForm.areaId),
    enabled: !!poiForm.areaId,
  });
  const pois = poisData?.data ?? [];

  const areaCitySelectValue = useMemo(() => {
    if (!areaForm.cityId) return '__none__';
    const found = cities.find((c: City) => String(c.id) === String(areaForm.cityId));
    return found ? String(found.id) : '__none__';
  }, [areaForm.cityId, cities]);

  const poiCitySelectValue = useMemo(() => {
    if (!poiForm.cityId) return '__none__';
    const found = cities.find((c: City) => String(c.id) === String(poiForm.cityId));
    return found ? String(found.id) : '__none__';
  }, [poiForm.cityId, cities]);

  const poiAreaSelectValue = useMemo(() => {
    if (!poiForm.areaId) return '__none__';
    const found = areas.find((a: Area) => String(a.id) === String(poiForm.areaId));
    return found ? String(found.id) : '__none__';
  }, [poiForm.areaId, areas]);

  const createCountryMut = useMutation({
    mutationFn: (d: { code: string; name?: string; nameVi?: string }) => adminGeographyApi.createCountry(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setCreateOpen(null); setCountryForm({ code: '', name: '', nameVi: '' }); },
  });
  const createCityMut = useMutation({
    mutationFn: (d: { countryId: string; name: string; nameVi?: string }) => adminGeographyApi.createCity(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setCreateOpen(null); setCityForm({ countryId: '', name: '', nameVi: '' }); },
  });
  const createAreaMut = useMutation({
    mutationFn: (d: { cityId: string; name: string; attribute?: unknown; status?: string }) => adminGeographyApi.createArea(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setCreateOpen(null); setAreaForm({ cityId: '', name: '', attribute: emptyAttribute, status: 'active' }); },
  });
  const createPoiMut = useMutation({
    mutationFn: (d: { areaId: string; name: string; poiType?: unknown }) => adminGeographyApi.createPoi(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setCreateOpen(null); setPoiForm({ areaId: '', name: '', poiType: emptyPoiType }); },
  });

  const updateCountryMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ code: string; name: string; nameVi: string }> }) => adminGeographyApi.updateCountry(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setEditRow(null); },
  });
  const updateCityMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ countryId: string; name: string; nameVi: string }> }) => adminGeographyApi.updateCity(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setEditRow(null); },
  });
  const updateAreaMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ cityId: string; name: string; attribute: unknown; status: string }> }) => adminGeographyApi.updateArea(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setEditRow(null); },
  });
  const updatePoiMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ areaId: string; name: string; poiType: unknown }> }) => adminGeographyApi.updatePoi(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setEditRow(null); },
  });

  const deleteCountryMut = useMutation({
    mutationFn: (id: string) => adminGeographyApi.deleteCountry(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setDeleteRow(null); },
  });
  const deleteCityMut = useMutation({
    mutationFn: (id: string) => adminGeographyApi.deleteCity(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setDeleteRow(null); },
  });
  const deleteAreaMut = useMutation({
    mutationFn: (id: string) => adminGeographyApi.deleteArea(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setDeleteRow(null); },
  });
  const deletePoiMut = useMutation({
    mutationFn: (id: string) => adminGeographyApi.deletePoi(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['geography'] }); setDeleteRow(null); },
  });

  const parseJson = (s: string): unknown => {
    try { return JSON.parse(s); } catch { return undefined; }
  };

  return (
    <>
      <PageHeader title="Địa điểm" description="Quản lý quốc gia, thành phố, khu vực và địa điểm nổi bật" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cây địa lý</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="countries" className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Quốc gia ({countries.length})
              </TabsTrigger>
              <TabsTrigger value="cities">Thành phố</TabsTrigger>
              <TabsTrigger value="areas">Khu vực</TabsTrigger>
              <TabsTrigger value="pois">Địa điểm POI</TabsTrigger>
            </TabsList>

            <TabsContent value="countries">
              <div className="flex justify-end mt-4">
                <Button onClick={() => setCreateOpen('country')}><Plus className="h-4 w-4 mr-2" /> Thêm quốc gia</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>Tên (VN)</TableHead><TableHead className="w-24">Thao tác</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map((c: Country) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.code}</TableCell>
                      <TableCell>{c.name ?? '-'}</TableCell>
                      <TableCell>{c.nameVi ?? '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditRow({ type: 'country', id: c.id, row: c })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteRow({ type: 'country', id: c.id, name: c.name ?? c.code })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="cities">
              <div className="flex justify-end mt-4">
                <Button onClick={() => setCreateOpen('city')} disabled={!countries.length}><Plus className="h-4 w-4 mr-2" /> Thêm thành phố</Button>
              </div>
              <div className="mb-4">
                <Label>Lọc theo quốc gia</Label>
                <Select value={cityForm.countryId || '__all__'} onValueChange={(v) => setCityForm((f) => ({ ...f, countryId: v === '__all__' ? '' : v }))}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Chọn quốc gia" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tất cả</SelectItem>
                    {countries.map((c: Country) => <SelectItem key={c.id} value={c.id}>{c.name ?? c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Quốc gia</TableHead><TableHead>Tên</TableHead><TableHead>Tên (VN)</TableHead><TableHead className="w-24">Thao tác</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city: City) => (
                    <TableRow key={city.id}>
                      <TableCell>{countries.find((c: Country) => c.id === city.countryId)?.name ?? city.countryId}</TableCell>
                      <TableCell>{city.name}</TableCell>
                      <TableCell>{city.nameVi ?? '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditRow({ type: 'city', id: city.id, row: { ...city, countryId: city.countryId } })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteRow({ type: 'city', id: city.id, name: city.name })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="areas">
              <div className="flex justify-end mt-4">
                <Button onClick={() => setCreateOpen('area')} disabled={!cities.length}><Plus className="h-4 w-4 mr-2" /> Thêm khu vực</Button>
              </div>
              <div className="mb-4 flex gap-4 flex-wrap">
                <div>
                  <Label>Quốc gia</Label>
                  <Select value={areaForm.countryId || '__none__'} onValueChange={(v) => setAreaForm((f) => ({ ...f, countryId: v === '__none__' ? '' : v, cityId: '' }))}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Chọn quốc gia" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Chọn quốc gia</SelectItem>
                      {countries.map((c: Country) => <SelectItem key={c.id} value={c.id}>{c.name ?? c.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Thành phố</Label>
                  <Select
                    key={`areas-city-${areaForm.countryId}`}
                    value={areaCitySelectValue}
                    onValueChange={(v) => setAreaForm((f) => ({ ...f, cityId: v === '__none__' ? '' : v }))}
                    disabled={!areaForm.countryId}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Chọn thành phố</SelectItem>
                      {cities.map((c: City) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Thành phố</TableHead><TableHead>Tên khu vực</TableHead><TableHead>Trạng thái</TableHead><TableHead className="w-24">Thao tác</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((a: Area) => (
                    <TableRow key={a.id}>
                      <TableCell>{cities.find((c: City) => c.id === a.cityId)?.name ?? a.cityId}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.status}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditRow({ type: 'area', id: a.id, row: { ...a, attribute: typeof a.attribute === 'object' ? JSON.stringify(a.attribute, null, 2) : (a.attribute ?? '{}') } })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteRow({ type: 'area', id: a.id, name: a.name })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pois">
              <div className="flex justify-end mt-4">
                <Button onClick={() => setCreateOpen('poi')} disabled={!areas.length}><Plus className="h-4 w-4 mr-2" /> Thêm địa điểm</Button>
              </div>
              <div className="mb-4 flex gap-4 flex-wrap">
                <div>
                  <Label>Quốc gia</Label>
                  <Select value={poiForm.countryId || '__none__'} onValueChange={(v) => setPoiForm((f) => ({ ...f, countryId: v === '__none__' ? '' : v, cityId: '', areaId: '' }))}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Chọn quốc gia" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Chọn quốc gia</SelectItem>
                      {countries.map((c: Country) => <SelectItem key={c.id} value={c.id}>{c.name ?? c.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Thành phố</Label>
                  <Select
                    key={`pois-city-${poiForm.countryId}`}
                    value={poiCitySelectValue}
                    onValueChange={(v) => setPoiForm((f) => ({ ...f, cityId: v === '__none__' ? '' : v, areaId: '' }))}
                    disabled={!poiForm.countryId}
                  >
                    <SelectTrigger className="w-64"><SelectValue placeholder="Chọn thành phố" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Chọn thành phố</SelectItem>
                      {cities.map((c: City) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Khu vực</Label>
                  <Select
                    key={`pois-area-${poiForm.cityId}`}
                    value={poiAreaSelectValue}
                    onValueChange={(v) => setPoiForm((f) => ({ ...f, areaId: v === '__none__' ? '' : v }))}
                    disabled={!poiForm.cityId}
                  >
                    <SelectTrigger className="w-64"><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Chọn khu vực</SelectItem>
                      {areas.map((a: Area) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Khu vực</TableHead><TableHead>Tên POI</TableHead><TableHead className="w-24">Thao tác</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pois.map((p: PointOfInterest) => (
                    <TableRow key={p.id}>
                      <TableCell>{areas.find((a: Area) => a.id === p.areaId)?.name ?? p.areaId}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditRow({ type: 'poi', id: p.id, row: { ...p, poiType: typeof p.poiType === 'object' ? JSON.stringify(p.poiType, null, 2) : (p.poiType ?? '{}') } })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteRow({ type: 'poi', id: p.id, name: p.name })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Country */}
      <Dialog open={createOpen === 'country'} onOpenChange={(o) => !o && setCreateOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm quốc gia</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Mã (ISO)</Label><Input value={countryForm.code} onChange={(e) => setCountryForm((f) => ({ ...f, code: e.target.value }))} placeholder="VN" /></div>
            <div><Label>Tên</Label><Input value={countryForm.name} onChange={(e) => setCountryForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Tên (tiếng Việt)</Label><Input value={countryForm.nameVi} onChange={(e) => setCountryForm((f) => ({ ...f, nameVi: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(null)}>Hủy</Button>
            <Button onClick={() => createCountryMut.mutate(countryForm)} disabled={!countryForm.code || createCountryMut.isPending}>
              {createCountryMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create City */}
      <Dialog open={createOpen === 'city'} onOpenChange={(o) => !o && setCreateOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm thành phố</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Quốc gia</Label>
              <Select value={cityForm.countryId} onValueChange={(v) => setCityForm((f) => ({ ...f, countryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn quốc gia" /></SelectTrigger>
                <SelectContent>{countries.map((c: Country) => <SelectItem key={c.id} value={c.id}>{c.name ?? c.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tên</Label><Input value={cityForm.name} onChange={(e) => setCityForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Tên (tiếng Việt)</Label><Input value={cityForm.nameVi} onChange={(e) => setCityForm((f) => ({ ...f, nameVi: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(null)}>Hủy</Button>
            <Button onClick={() => createCityMut.mutate({ countryId: cityForm.countryId, name: cityForm.name, nameVi: cityForm.nameVi || undefined })} disabled={!cityForm.countryId || !cityForm.name || createCityMut.isPending}>
              {createCityMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Area */}
      <Dialog open={createOpen === 'area'} onOpenChange={(o) => !o && setCreateOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Thêm khu vực</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Thành phố</Label>
              <Select value={areaForm.cityId} onValueChange={(v) => setAreaForm((f) => ({ ...f, cityId: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn thành phố" /></SelectTrigger>
                <SelectContent>{cities.map((c: City) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tên khu vực</Label><Input value={areaForm.name} onChange={(e) => setAreaForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Attribute (JSON)</Label><textarea className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={areaForm.attribute} onChange={(e) => setAreaForm((f) => ({ ...f, attribute: e.target.value }))} /></div>
            <div><Label>Trạng thái</Label>
              <Select value={areaForm.status} onValueChange={(v) => setAreaForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">active</SelectItem><SelectItem value="inactive">inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(null)}>Hủy</Button>
            <Button onClick={() => createAreaMut.mutate({ cityId: areaForm.cityId, name: areaForm.name, attribute: parseJson(areaForm.attribute) ?? undefined, status: areaForm.status })} disabled={!areaForm.cityId || !areaForm.name || createAreaMut.isPending}>
              {createAreaMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create POI */}
      <Dialog open={createOpen === 'poi'} onOpenChange={(o) => !o && setCreateOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Thêm địa điểm POI</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Khu vực</Label>
              <Select value={poiForm.areaId} onValueChange={(v) => setPoiForm((f) => ({ ...f, areaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                <SelectContent>{areas.map((a: Area) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tên địa điểm</Label><Input value={poiForm.name} onChange={(e) => setPoiForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>poi_type (JSON)</Label><textarea className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={poiForm.poiType} onChange={(e) => setPoiForm((f) => ({ ...f, poiType: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(null)}>Hủy</Button>
            <Button onClick={() => createPoiMut.mutate({ areaId: poiForm.areaId, name: poiForm.name, poiType: parseJson(poiForm.poiType) ?? undefined })} disabled={!poiForm.areaId || !poiForm.name || createPoiMut.isPending}>
              {createPoiMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialogs - simplified: same as create but with updateMutation and prefill */}
      {editRow?.type === 'country' && (
        <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Sửa quốc gia</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Mã</Label><Input defaultValue={editRow.row.code as string} id="edit-code" /></div>
              <div><Label>Tên</Label><Input defaultValue={editRow.row.name as string} id="edit-name" /></div>
              <div><Label>Tên (VN)</Label><Input defaultValue={(editRow.row.nameVi as string) ?? ''} id="edit-nameVi" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>Hủy</Button>
              <Button onClick={() => {
                const code = (document.getElementById('edit-code') as HTMLInputElement)?.value;
                const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
                const nameVi = (document.getElementById('edit-nameVi') as HTMLInputElement)?.value;
                updateCountryMut.mutate({ id: editRow.id, body: { code, name, nameVi } });
              }} disabled={updateCountryMut.isPending}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editRow?.type === 'city' && (
        <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Sửa thành phố</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Quốc gia</Label>
                <Select value={(editRow.row.countryId as string) ?? ''} onValueChange={(v) => setEditRow((r) => r ? { ...r, row: { ...r.row, countryId: v } } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{countries.map((c: Country) => <SelectItem key={c.id} value={c.id}>{c.name ?? c.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tên</Label><Input defaultValue={editRow.row.name as string} id="edit-city-name" /></div>
              <div><Label>Tên (VN)</Label><Input defaultValue={(editRow.row.nameVi as string) ?? ''} id="edit-city-nameVi" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>Hủy</Button>
              <Button onClick={() => {
                const name = (document.getElementById('edit-city-name') as HTMLInputElement)?.value;
                const nameVi = (document.getElementById('edit-city-nameVi') as HTMLInputElement)?.value;
                updateCityMut.mutate({ id: editRow.id, body: { countryId: editRow.row.countryId as string, name, nameVi } });
              }} disabled={updateCityMut.isPending}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editRow?.type === 'area' && (
        <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} className="max-w-2xl">
          <DialogContent>
            <DialogHeader><DialogTitle>Sửa khu vực</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Thành phố</Label>
                <Select value={(editRow.row.cityId as string) ?? ''} onValueChange={(v) => setEditRow((r) => r ? { ...r, row: { ...r.row, cityId: v } } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{cities.map((c: City) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tên</Label><Input defaultValue={editRow.row.name as string} id="edit-area-name" /></div>
              <div><Label>Attribute (JSON)</Label><textarea className="min-h-[120px] w-full rounded-md border font-mono text-sm" defaultValue={editRow.row.attribute as string} id="edit-area-attribute" /></div>
              <div><Label>Trạng thái</Label>
                <Select value={(editRow.row.status as string) ?? 'active'} onValueChange={(v) => setEditRow((r) => r ? { ...r, row: { ...r.row, status: v } } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">active</SelectItem><SelectItem value="inactive">inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>Hủy</Button>
              <Button onClick={() => {
                const name = (document.getElementById('edit-area-name') as HTMLInputElement)?.value;
                const attribute = (document.getElementById('edit-area-attribute') as HTMLTextAreaElement)?.value;
                updateAreaMut.mutate({ id: editRow.id, body: { cityId: editRow.row.cityId as string, name, attribute: parseJson(attribute), status: editRow.row.status as string } });
              }} disabled={updateAreaMut.isPending}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editRow?.type === 'poi' && (
        <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} className="max-w-2xl">
          <DialogContent>
            <DialogHeader><DialogTitle>Sửa địa điểm POI</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Khu vực</Label>
                <Select value={(editRow.row.areaId as string) ?? ''} onValueChange={(v) => setEditRow((r) => r ? { ...r, row: { ...r.row, areaId: v } } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{areas.map((a: Area) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tên</Label><Input defaultValue={editRow.row.name as string} id="edit-poi-name" /></div>
              <div><Label>poi_type (JSON)</Label><textarea className="min-h-[120px] w-full rounded-md border font-mono text-sm" defaultValue={editRow.row.poiType as string} id="edit-poi-poiType" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>Hủy</Button>
              <Button onClick={() => {
                const name = (document.getElementById('edit-poi-name') as HTMLInputElement)?.value;
                const poiType = (document.getElementById('edit-poi-poiType') as HTMLTextAreaElement)?.value;
                updatePoiMut.mutate({ id: editRow.id, body: { areaId: editRow.row.areaId as string, name, poiType: parseJson(poiType) } });
              }} disabled={updatePoiMut.isPending}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteRow}
        title="Xác nhận xóa"
        description={deleteRow ? `Bạn có chắc muốn xóa "${deleteRow.name}"?` : ''}
        onConfirm={() => {
          if (!deleteRow) return;
          if (deleteRow.type === 'country') deleteCountryMut.mutate(deleteRow.id);
          else if (deleteRow.type === 'city') deleteCityMut.mutate(deleteRow.id);
          else if (deleteRow.type === 'area') deleteAreaMut.mutate(deleteRow.id);
          else if (deleteRow.type === 'poi') deletePoiMut.mutate(deleteRow.id);
        }}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
};

export default AdminGeography;

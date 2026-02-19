import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerGeographyApi } from '@/api/owner-geography.api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ServiceDetail = () => {
    const { idItem } = useParams<{ idItem: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [roomName, setRoomName] = useState('');
    const [maxGuest, setMaxGuest] = useState('2');
    const [roomPrice, setRoomPrice] = useState('');

    const uploadMediaMut = useMutation({
        mutationFn: (d: FormData) => ownerGeographyApi.addItemMedia(idItem!, d),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã tải lên hình ảnh mới' });
            setImageFile(null);
        },
    });

    const addRoomMut = useMutation({
        mutationFn: (d: any) => ownerGeographyApi.addAccommodationRoom(idItem!, d),
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã thêm phòng mới' });
            setRoomName('');
            setRoomPrice('');
        },
    });

    const handleUploadImage = () => {
        if (!imageFile) return;
        const formData = new FormData();
        formData.append('image', imageFile);
        uploadMediaMut.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
            </Button>

            <PageHeader
                title="Chi tiết dịch vụ"
                description="Quản lý hình ảnh và các thông tin bổ sung cho dịch vụ của bạn"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" /> Hình ảnh dịch vụ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Chọn ảnh mới</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                                <Button
                                    onClick={handleUploadImage}
                                    disabled={!imageFile || uploadMediaMut.isPending}
                                >
                                    {uploadMediaMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tải lên'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Quản lý thông tin bổ sung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Tùy vào loại dịch vụ (Lưu trú, Tours, Vé), bạn có thể thêm các thông tin như danh sách phòng, lịch trình hoặc chi tiết xe.
                        </p>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">Thêm phòng (Nếu là Lưu trú)</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Thêm phòng mới</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div>
                                        <Label>Tên phòng</Label>
                                        <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ví dụ: Phòng Deluxe" />
                                    </div>
                                    <div>
                                        <Label>Số khách tối đa</Label>
                                        <Input type="number" value={maxGuest} onChange={(e) => setMaxGuest(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Giá phòng</Label>
                                        <Input type="number" value={roomPrice} onChange={(e) => setRoomPrice(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={() => addRoomMut.mutate({ nameRoom: roomName, maxGuest: Number(maxGuest), price: Number(roomPrice) })}
                                        disabled={addRoomMut.isPending || !roomName || !roomPrice}
                                    >
                                        {addRoomMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        Lưu
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ServiceDetail;

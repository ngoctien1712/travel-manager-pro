import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth.api';
import { geographyApi } from '@/api/geography.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Briefcase,
    CheckCircle,
    Loader2,
    ArrowRight,
    Phone,
    Mail,
    Globe,
    Wallet,
    FileText,
    User,
    Lock,
    X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export const BusinessRegister = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // User Account Info
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [personalPhone, setPersonalPhone] = useState('');

    // Business info
    const [businessName, setBusinessName] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [fanpage, setFanpage] = useState('');
    const [serviceType, setServiceType] = useState<'tour' | 'accommodation' | 'vehicle'>('tour');
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    // Bank details
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');

    // Geography selection
    const [countryId, setCountryId] = useState('');
    const [cityId, setCityId] = useState('');
    const [areaId, setAreaId] = useState('');

    // Data fetching
    const { data: countriesRes } = useQuery({
        queryKey: ['geography', 'countries'],
        queryFn: () => geographyApi.listCountries(),
    });
    const countries = countriesRes?.data ?? [];

    const { data: citiesRes } = useQuery({
        queryKey: ['geography', 'cities', countryId],
        queryFn: () => geographyApi.listCities(countryId),
        enabled: !!countryId,
    });
    const cities = citiesRes?.data ?? [];

    const { data: areasRes } = useQuery({
        queryKey: ['geography', 'areas', cityId],
        queryFn: () => geographyApi.listAreas(cityId, 'active'),
        enabled: !!cityId,
    });
    const areas = areasRes?.data ?? [];

    // Default to VN
    useEffect(() => {
        if (countries.length > 0 && !countryId) {
            const vn = countries.find((c: any) => c.code === 'VN');
            if (vn) setCountryId(vn.id);
        }
    }, [countries, countryId]);

    const validate = () => {
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Email không hợp lệ');
            return false;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        if (!fullName.trim()) {
            setError('Vui lòng điền họ tên');
            return false;
        }
        if (!businessName.trim()) {
            setError('Vui lòng điền tên doanh nghiệp');
            return false;
        }
        if (!areaId) {
            setError('Vui lòng chọn khu vực hoạt động');
            return false;
        }
        if (!businessPhone.trim()) {
            setError('Vui lòng điền số điện thoại doanh nghiệp');
            return false;
        }
        if (imageFiles.length === 0) {
            setError('Vui lòng đính kèm ít nhất một ảnh văn bản pháp lý (Giấy phép kinh doanh, MST...)');
            return false;
        }
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            // User info
            formData.append('email', email);
            formData.append('password', password);
            formData.append('fullName', fullName);
            formData.append('phone', personalPhone);

            // Business info
            formData.append('businessName', businessName);
            formData.append('areaId', areaId);
            formData.append('businessPhone', businessPhone);
            formData.append('contactEmail', contactEmail || email);
            formData.append('fanpage', fanpage);
            formData.append('serviceType', serviceType);

            // Bank
            formData.append('bankName', bankName);
            formData.append('bankAccountNumber', bankAccountNumber);
            formData.append('bankAccountName', bankAccountName);

            // Multiple legal documents
            imageFiles.forEach(file => {
                formData.append('images', file);
            });

            await authApi.registerBusiness(formData);
            setIsSuccess(true);
            toast.success('Gửi yêu cầu thành công!');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu đăng ký');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="container max-w-2xl py-20 px-4">
                <Card className="text-center p-8 border-green-200 shadow-lg shadow-green-50">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl pt-4">Gửi Hồ sơ Thành công!</CardTitle>
                        <CardDescription className="text-base pt-2">
                            Tài khoản quản trị và hồ sơ pháp lý của bạn đã được tiếp nhận.
                            <br />
                            Admin sẽ thẩm định các văn bản pháp lý và kích hoạt tài khoản cho bạn trong vòng 24h làm việc.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pt-8">
                        <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">Quay về trang chủ</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-3 tracking-tight">Hợp tác cùng VietTravel</h1>
                <p className="text-muted-foreground text-lg">Đăng ký tài khoản Đối tác & Cung cấp hồ sơ pháp lý doanh nghiệp</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm font-medium border border-destructive/20 flex items-center gap-3">
                        <X className="h-5 w-5 shrink-0" onClick={() => setError('')} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Column Left: Account & Documents */}
                    <div className="lg:col-span-7 space-y-8">
                        <Card className="shadow-md border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-5 w-5 text-primary" />
                                    Tài khoản Quản trị viên
                                </CardTitle>
                                <CardDescription>Thông tin đăng nhập sau khi được Admin kích hoạt</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="email">Email đăng nhập *</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" required />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="password">Mật khẩu *</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" required />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="fullName">Họ và tên người quản lý *</Label>
                                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn A" required />
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="personalPhone">SĐT cá nhân</Label>
                                    <Input id="personalPhone" value={personalPhone} onChange={(e) => setPersonalPhone(e.target.value)} placeholder="Liên hệ trực tiếp" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-md border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Hồ sơ pháp lý (Bắt buộc)
                                </CardTitle>
                                <CardDescription>Tải lên ảnh Giấy phép kinh doanh, MST hoặc các văn bản xác thực khác</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative min-h-[160px] flex items-center justify-center">
                                    <div className="flex flex-col items-center pointer-events-none">
                                        <Briefcase className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">Nhấn để chọn hoặc kéo thả nhiều ảnh</p>
                                        <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG (Tối đa 10 ảnh)</p>
                                    </div>
                                    <input
                                        id="images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    />
                                </div>

                                {imageFiles.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                        {imageFiles.map((file, idx) => (
                                            <div key={idx} className="relative group rounded-md border p-2 bg-card">
                                                <div className="aspect-square rounded overflow-hidden mb-1">
                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                                                </div>
                                                <p className="text-[10px] truncate pr-4">{file.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column Right: Business & Bank */}
                    <div className="lg:col-span-5 space-y-8">
                        <Card className="shadow-md border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b pb-4">
                                <CardTitle className="text-lg">Thông tin kinh doanh</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Tên doanh nghiệp / Nhà cung cấp *</Label>
                                    <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Tên hiển thị trên hệ thống" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="serviceType">Loại hình dịch vụ *</Label>
                                    <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tour">Tour & Trải nghiệm</SelectItem>
                                            <SelectItem value="accommodation">Lưu trú (Hotel/Villa...)</SelectItem>
                                            <SelectItem value="vehicle">Dịch vụ Vận chuyển</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessPhone">SĐT Doanh nghiệp *</Label>
                                    <Input id="businessPhone" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="Số hotline nhận khách" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Email công việc</Label>
                                    <Input id="contactEmail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Nếu khác email đăng nhập" />
                                </div>

                                <div className="pt-2">
                                    <Label className="text-xs uppercase text-muted-foreground mb-2 block font-bold">Khu vực hoạt động</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select value={countryId} onValueChange={(v) => { setCountryId(v); setCityId(''); setAreaId(''); }}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Quốc gia" /></SelectTrigger>
                                            <SelectContent>
                                                {countries.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={cityId} onValueChange={(v) => { setCityId(v); setAreaId(''); }} disabled={!countryId}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Thành phố" /></SelectTrigger>
                                            <SelectContent>
                                                {cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Select value={areaId} onValueChange={setAreaId} disabled={!cityId}>
                                        <SelectTrigger className="h-9 mt-3"><SelectValue placeholder="Chọn quận/huyện/khu vực" /></SelectTrigger>
                                        <SelectContent>
                                            {areas.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-md">
                            <CardHeader className="pb-3 border-b mb-4"><CardTitle className="text-sm uppercase text-primary/80">Thanh toán đối tác</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Ngân hàng</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ví dụ: Vietcombank, MB..." className="pl-9 h-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Số tài khoản</Label>
                                    <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Nhập STK chính xác" className="h-9" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Tên chủ tài khoản (In hoa không dấu)</Label>
                                    <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value.toUpperCase())} placeholder="NGUYEN VAN A" className="h-9" />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" size="lg" className="w-full py-8 text-xl shadow-lg hover:shadow-primary/30 transition-all font-bold" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    Đang nộp hồ sơ...
                                </>
                            ) : (
                                <>
                                    Gửi Hồ sơ Đăng ký
                                    <ArrowRight className="ml-3 h-6 w-6" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BusinessRegister;

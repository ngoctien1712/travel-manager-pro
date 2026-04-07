import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Loader2, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { toast } from 'sonner';

export const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [isExpired, setIsExpired] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
            return;
        }

        if (timeLeft <= 0) {
            setIsExpired(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, email, navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Mã OTP phải có 6 chữ số');
            return;
        }

        setLoading(true);
        try {
            await authApi.verifyOTP(email, otp);
            toast.success('Xác thực tài khoản thành công!');
            navigate('/login', { state: { message: 'Xác thực thành công. Bạn có thể đăng nhập.' } });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authApi.resendOTP(email);
            toast.success('Mã OTP mới đã được gửi');
            setTimeLeft(300);
            setIsExpired(false);
            setOtp('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gửi thất bại');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Logo" className="mx-auto h-16 w-16 mb-4 object-contain" />
                    <h1 className="text-3xl font-display font-bold">Trip Mana Pro</h1>
                    <p className="text-muted-foreground mt-2">Xác thực tài khoản của bạn</p>
                </div>

                <Card className="card-elevated border-primary/10 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            Nhập mã OTP
                        </CardTitle>
                        <CardDescription>
                            Chúng tôi đã gửi mã xác thực 6 số đến email <span className="font-semibold text-foreground">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="otp">Mã xác thực</Label>
                                    <span className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-primary'}`}>
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                                <Input
                                    id="otp"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    className="text-center text-3xl tracking-[0.5em] font-mono h-16 bg-background border-2 focus-visible:ring-primary/20"
                                    disabled={loading || isExpired}
                                    autoFocus
                                />
                                {isExpired && (
                                    <p className="text-xs text-destructive mt-1 text-center">
                                        Mã OTP đã hết hạn. Vui lòng nhấn gửi lại.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Button type="submit" className="w-full h-12 text-lg shadow-md" disabled={loading || isExpired || otp.length < 6}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Đang xác thực...
                                        </>
                                    ) : 'Xác nhận'}
                                </Button>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-12"
                                        onClick={handleResend}
                                        disabled={resending || (!isExpired && timeLeft > 0)}
                                    >
                                        {resending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        {timeLeft > 0 && !isExpired ? `Gửi lại sau (${timeLeft}s)` : 'Gửi lại mã OTP'}
                                    </Button>

                                    <Button variant="ghost" asChild className="w-full">
                                        <Link to="/register">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Quay lại đăng ký
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div className="mt-8 text-center text-sm text-muted-foreground animate-pulse">
                    Đang đợi mã xác thực? Kiểm tra cả hộp thư Spam
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;

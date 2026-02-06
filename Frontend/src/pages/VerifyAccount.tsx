import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';

export const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link xác thực không hợp lệ');
      return;
    }
    authApi.verifyAccount(token)
      .then(() => {
        setStatus('success');
        setMessage('Xác thực tài khoản thành công');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Xác thực thất bại');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-ocean mb-4">
            <Map className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold">VietTravel</h1>
          <p className="text-muted-foreground mt-2">Xác thực tài khoản</p>
        </div>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              {status === 'loading' && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p>Đang xác thực tài khoản...</p>
                </>
              )}
              {status === 'success' && (
                <>
                  <div className="rounded-full bg-success/10 p-3">
                    <CheckCircle className="h-10 w-10 text-success" />
                  </div>
                  <h2 className="text-xl font-semibold">{message}</h2>
                  <p className="text-muted-foreground">
                    Bạn có thể đăng nhập vào tài khoản ngay bây giờ.
                  </p>
                  <Button asChild className="w-full mt-4">
                    <Link to="/login">Đăng nhập</Link>
                  </Button>
                </>
              )}
              {status === 'error' && (
                <>
                  <div className="rounded-full bg-destructive/10 p-3">
                    <XCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <h2 className="text-xl font-semibold">Xác thực thất bại</h2>
                  <p className="text-muted-foreground">{message}</p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/login">Quay lại đăng nhập</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyAccount;

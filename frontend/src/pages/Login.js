import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [loginRole, setLoginRole] = useState('accounting');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const sessionId = params.get('session_id');

    if (sessionId) {
      handleGoogleCallback(sessionId);
    }
  }, []);

  useEffect(() => {
    if (user) {
      redirectToDashboard(user.role);
    }
  }, [user]);

  const handleGoogleCallback = async (sessionId) => {
    setLoading(true);
    try {
      const result = await loginWithGoogle(sessionId);
      toast.success('Login berhasil!');
      // Clean URL
      window.history.replaceState(null, '', '/login');
      redirectToDashboard(result.user.role);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const redirectToDashboard = (userRole) => {
    switch (userRole) {
      case 'accounting':
        navigate('/accounting');
        break;
      case 'estimator':
        navigate('/estimator');
        break;
      case 'site_supervisor':
        navigate('/supervisor');
        break;
      case 'employee':
        navigate('/employee');
        break;
      default:
        navigate('/');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      toast.success('Login berhasil!');
      redirectToDashboard(result.user.role);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name, role);
      toast.success('Registrasi berhasil! Silakan login.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/login';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (loading && location.hash.includes('session_id')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memproses login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800" data-testid="app-title">XON Architect</h1>
          <p className="text-slate-600 mt-2">Sistem Manajemen Proyek</p>
        </div>

        <Card className="shadow-xl border-0" data-testid="login-card">
          <CardHeader>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>Masuk atau daftar untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" data-testid="login-form">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
                    {loading ? 'Memproses...' : 'Login'}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Atau</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  data-testid="google-login-btn"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Login dengan Google
                </Button>
              </TabsContent>

              <TabsContent value="register" data-testid="register-form">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-testid="register-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="register-password-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger data-testid="register-role-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accounting">Accounting</SelectItem>
                        <SelectItem value="estimator">Estimator</SelectItem>
                        <SelectItem value="site_supervisor">Site Supervisor</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit-btn">
                    {loading ? 'Memproses...' : 'Daftar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
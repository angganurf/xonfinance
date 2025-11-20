import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Users, 
  Calculator, 
  HardHat, 
  UserCheck, 
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTransactions: 0,
    cashBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersRes = await api.get('/admin/members');
      
      // Fetch projects
      const projectsRes = await api.get('/projects');
      
      // Fetch financial summary
      const financialRes = await api.get('/financial/summary');
      
      // Fetch transactions
      const transactionsRes = await api.get('/transactions');
      
      setStats({
        totalUsers: usersRes.data.length,
        totalProjects: projectsRes.data.length,
        totalTransactions: transactionsRes.data.length,
        cashBalance: financialRes.data.cash_balance
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Gagal memuat data statistik');
    } finally {
      setLoading(false);
    }
  };

  const dashboards = [
    {
      title: 'Accounting',
      description: 'Kelola keuangan dan transaksi',
      icon: DollarSign,
      path: '/accounting',
      color: 'bg-blue-500',
      stats: `${stats.totalTransactions} transaksi`
    },
    {
      title: 'Estimator',
      description: 'Buat dan kelola RAB proyek',
      icon: Calculator,
      path: '/estimator',
      color: 'bg-green-500',
      stats: `${stats.totalProjects} proyek`
    },
    {
      title: 'Site Supervisor',
      description: 'Pantau jadwal proyek',
      icon: HardHat,
      path: '/supervisor',
      color: 'bg-orange-500',
      stats: `${stats.totalProjects} proyek`
    },
    {
      title: 'Employee',
      description: 'Lihat tugas harian',
      icon: UserCheck,
      path: '/employee',
      color: 'bg-purple-500',
      stats: '-'
    }
  ];

  const quickActions = [
    {
      title: 'Kelola Member',
      description: 'Tambah, edit, atau hapus pengguna',
      icon: Users,
      path: '/admin/members',
      color: 'text-blue-600'
    },
    {
      title: 'Laporan Keuangan',
      description: 'Lihat ringkasan keuangan lengkap',
      icon: TrendingUp,
      path: '/accounting',
      color: 'text-green-600'
    },
    {
      title: 'Statistik Proyek',
      description: 'Analisis performa proyek',
      icon: BarChart3,
      path: '/accounting',
      color: 'text-orange-600'
    }
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto" data-testid="admin-dashboard">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Selamat datang, Administrator. Kelola seluruh sistem dari sini.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Proyek</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalProjects}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Transaksi</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalTransactions}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Saldo Kas</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {stats.cashBalance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access to All Dashboards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Akses Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboards.map((dashboard) => (
              <Card 
                key={dashboard.path}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(dashboard.path)}
              >
                <CardContent className="pt-6">
                  <div className={`${dashboard.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <dashboard.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{dashboard.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{dashboard.description}</p>
                  <p className="text-xs text-slate-500">{dashboard.stats}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card 
                key={action.path}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <action.icon className={`h-8 w-8 ${action.color}`} />
                    <div>
                      <h3 className="font-bold text-slate-800 mb-1">{action.title}</h3>
                      <p className="text-sm text-slate-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

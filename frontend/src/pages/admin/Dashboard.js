import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Users, 
  Calculator, 
  DollarSign,
  BarChart3,
  Settings
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    cashBalance: 0,
    cashPercentage: 0,
    totalProjectValue: 0,
    totalProjects: 0,
    unbilledBudget: 0,
    unbilledPercentage: 0,
    totalKasMasuk: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    remainingBudget: 0,
    budgetUsedPercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsRes = await api.get('/projects');
      
      // Fetch financial summary
      const financialRes = await api.get('/financial/summary');
      
      // Fetch transactions
      const transactionsRes = await api.get('/transactions');
      
      // Calculate total project value (contract value)
      const totalProjectValue = projectsRes.data.reduce((sum, project) => {
        return sum + (project.project_value || 0);
      }, 0);
      
      // Calculate total kas masuk (income from all projects)
      const totalKasMasuk = transactionsRes.data.reduce((sum, trans) => {
        if (trans.category === 'kas_masuk' || trans.category === 'uang_masuk') {
          return sum + (trans.amount || 0);
        }
        return sum;
      }, 0);
      
      // Calculate unbilled budget (project value - kas masuk)
      const unbilledBudget = totalProjectValue - totalKasMasuk;
      
      // Calculate percentages
      const unbilledPercentage = totalProjectValue > 0 
        ? Math.round((unbilledBudget / totalProjectValue) * 100) 
        : 0;
      
      // Calculate total expenses (all non-income transactions)
      const totalExpenses = transactionsRes.data.reduce((sum, trans) => {
        if (trans.category !== 'kas_masuk' && trans.category !== 'uang_masuk' && trans.category !== 'aset') {
          return sum + (trans.amount || 0);
        }
        return sum;
      }, 0);
      
      // Calculate P&L (Profit & Loss) = Total Nilai Proyek - Total Pengeluaran
      const netProfit = totalProjectValue - totalExpenses;
      const profitMargin = totalProjectValue > 0
        ? Math.round((netProfit / totalProjectValue) * 100)
        : 0;
      
      // Calculate remaining budget (project value - total expenses)
      const remainingBudget = totalProjectValue - totalExpenses;
      const budgetUsedPercentage = totalProjectValue > 0
        ? Math.round((totalExpenses / totalProjectValue) * 100)
        : 0;
      
      // Calculate cash percentage from total kas masuk
      const cashPercentage = totalKasMasuk > 0
        ? Math.round((financialRes.data.cash_balance / totalKasMasuk) * 100)
        : 0;
      
      setStats({
        cashBalance: financialRes.data.cash_balance,
        cashPercentage,
        totalProjectValue,
        totalProjects: projectsRes.data.length,
        unbilledBudget,
        unbilledPercentage,
        totalKasMasuk,
        totalExpenses,
        netProfit,
        profitMargin,
        remainingBudget,
        budgetUsedPercentage
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
      stats: `Saldo: Rp ${(stats.cashBalance / 1000000).toFixed(0)}jt`
    },
    {
      title: 'Estimator',
      description: 'Buat dan kelola RAB proyek',
      icon: Calculator,
      path: '/estimator',
      color: 'bg-green-500',
      stats: `${stats.totalProjects} proyek aktif`
    }
  ];

  const quickActions = [
    {
      title: 'Kelola Member',
      description: 'Tambah, edit, atau hapus pengguna',
      icon: Users,
      path: '/admin/members',
      color: 'text-blue-600'
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

        {/* Stats Overview - Row 1: 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Saldo Kas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Saldo Kas</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {stats.cashBalance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Dari Kas Masuk</span>
                  <span className="font-semibold">{stats.cashPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.cashPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Nilai Proyek */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Total Nilai Proyek</p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {stats.totalProjectValue.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{stats.totalProjects} Proyek</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anggaran Belum Ditagihkan */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Belum Ditagihkan</p>
                  <p className="text-2xl font-bold text-orange-600">
                    Rp {stats.unbilledBudget.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Dari Total Nilai Proyek</span>
                  <span className="font-semibold">{stats.unbilledPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.unbilledPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sisa Anggaran */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Sisa Anggaran</p>
                  <p className="text-2xl font-bold text-purple-600">
                    Rp {stats.remainingBudget.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Anggaran Terpakai</span>
                  <span className="font-semibold">{stats.budgetUsedPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.budgetUsedPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview - Row 2: P&L */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* P&L (Profit & Loss) */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">Profit & Loss (P&L)</p>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    stats.netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stats.profitMargin}% margin
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Project Value */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Nilai Proyek</span>
                  <span className="text-sm font-semibold text-blue-600">
                    Rp {stats.totalProjectValue.toLocaleString('id-ID')}
                  </span>
                </div>
                
                {/* Kas Masuk */}
                <div className="flex justify-between items-center pl-4 border-l-2 border-green-200">
                  <span className="text-xs text-slate-600">Kas Masuk</span>
                  <span className="text-xs font-semibold text-green-600">
                    Rp {stats.totalKasMasuk.toLocaleString('id-ID')}
                  </span>
                </div>
                
                {/* Expenses */}
                <div className="flex justify-between items-center pl-4 border-l-2 border-red-200">
                  <span className="text-xs text-slate-600">Pengeluaran</span>
                  <span className="text-xs font-semibold text-red-600">
                    -Rp {stats.totalExpenses.toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Net Profit (P&L)</span>
                    <span className={`text-xl font-bold ${
                      stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Rp {stats.netProfit.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    = Nilai Proyek - Pengeluaran
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Placeholder untuk card kedua jika diperlukan */}
          <div></div>
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

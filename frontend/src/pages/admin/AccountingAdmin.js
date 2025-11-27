import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, FileText, Eye, Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import api from '../../utils/api';

const AccountingAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalProjectValue: 0,
    totalExpenses: 0,
    totalBudgetRemaining: 0,
    totalProfit: 0,
    projectCount: 0,
    saldoKas: 0,
    labaBersih: 0,
    totalAset: 0,
    totalPendapatan: 0,
    totalBebanOperasional: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [plData, setPLData] = useState({
    pendapatan: 0,
    bebanPokok: 0,
    labaBruto: 0,
    bebanOperasional: 0,
    labaBersih: 0
  });
  const [neraca, setNeraca] = useState({
    aset: {
      kas: 0,
      piutang: 0,
      persediaan: 0,
      asetTetap: 0,
      total: 0
    },
    kewajiban: {
      hutang: 0,
      total: 0
    },
    ekuitas: {
      modal: 0,
      labaDitahan: 0,
      total: 0
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, transactionsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/transactions')
      ]);

      const projectsList = projectsRes.data;
      const allTransactions = transactionsRes.data;
      setTransactions(allTransactions);

      // Calculate statistics per project
      const projectsWithStats = projectsList.map(project => {
        const projectTransactions = allTransactions.filter(t => t.project_id === project.id);
        const totalExpense = projectTransactions
          .filter(t => ['bahan', 'upah', 'alat', 'vendor', 'operasional'].includes(t.category))
          .reduce((sum, t) => sum + (t.total_amount || 0), 0);
        const budgetRemaining = (project.project_value || 0) - totalExpense;
        const budgetUsage = project.project_value > 0 ? (totalExpense / project.project_value) * 100 : 0;
        
        return {
          ...project,
          totalExpense,
          budgetRemaining,
          budgetUsage,
          transactionCount: projectTransactions.length
        };
      });

      setProjects(projectsWithStats);

      // Calculate overall statistics
      const totalProjectValue = projectsWithStats.reduce((sum, p) => sum + (p.project_value || 0), 0);
      const totalExpenses = projectsWithStats.reduce((sum, p) => sum + p.totalExpense, 0);
      const totalBudgetRemaining = totalProjectValue - totalExpenses;

      // Calculate financial data
      const kasMasuk = allTransactions
        .filter(t => t.category === 'kas_masuk')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      const kasKeluar = allTransactions
        .filter(t => ['bahan', 'upah', 'alat', 'vendor', 'operasional'].includes(t.category))
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      const saldoKas = kasMasuk - kasKeluar;

      // Calculate P&L
      const pendapatan = totalProjectValue; // Total nilai proyek sebagai pendapatan
      const bebanPokok = allTransactions
        .filter(t => ['bahan', 'upah', 'alat'].includes(t.category))
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const labaBruto = pendapatan - bebanPokok;
      const bebanOperasional = allTransactions
        .filter(t => ['vendor', 'operasional'].includes(t.category))
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const labaBersih = labaBruto - bebanOperasional;

      setPLData({
        pendapatan,
        bebanPokok,
        labaBruto,
        bebanOperasional,
        labaBersih
      });

      // Calculate Neraca (Balance Sheet)
      const piutang = allTransactions
        .filter(t => t.category === 'piutang')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      const persediaan = allTransactions
        .filter(t => t.category === 'bahan')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      const asetTetap = allTransactions
        .filter(t => t.category === 'aset')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      const totalAset = saldoKas + piutang + persediaan + asetTetap;

      const hutang = allTransactions
        .filter(t => t.category === 'hutang')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);

      const modal = totalProjectValue;
      const labaDitahan = labaBersih;
      const totalEkuitas = modal + labaDitahan;

      setNeraca({
        aset: {
          kas: saldoKas,
          piutang,
          persediaan,
          asetTetap,
          total: totalAset
        },
        kewajiban: {
          hutang,
          total: hutang
        },
        ekuitas: {
          modal,
          labaDitahan,
          total: totalEkuitas
        }
      });

      // Calculate expenses by category (global)
      const expensesByCategory = {
        bahan: allTransactions.filter(t => t.category === 'bahan').reduce((sum, t) => sum + (t.total_amount || 0), 0),
        upah: allTransactions.filter(t => t.category === 'upah').reduce((sum, t) => sum + (t.total_amount || 0), 0),
        alat: allTransactions.filter(t => t.category === 'alat').reduce((sum, t) => sum + (t.total_amount || 0), 0),
        operasional: allTransactions.filter(t => t.category === 'operasional').reduce((sum, t) => sum + (t.total_amount || 0), 0),
        vendor: allTransactions.filter(t => t.category === 'vendor').reduce((sum, t) => sum + (t.total_amount || 0), 0),
      };

      setStatistics({
        totalProjectValue,
        totalExpenses,
        totalBudgetRemaining,
        totalProfit: totalBudgetRemaining,
        projectCount: projectsList.length,
        saldoKas,
        labaBersih,
        totalAset,
        totalPendapatan: pendapatan,
        totalBebanOperasional: bebanOperasional,
        expensesByCategory
      });

      // Prepare monthly trend data
      const monthlyExpenses = {};
      const monthlyIncome = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      allTransactions.forEach(transaction => {
        if (transaction.transaction_date) {
          const date = new Date(transaction.transaction_date);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          
          if (transaction.category === 'kas_masuk') {
            monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + (transaction.total_amount || 0);
          } else if (['bahan', 'upah', 'alat', 'vendor', 'operasional'].includes(transaction.category)) {
            monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + (transaction.total_amount || 0);
          }
        }
      });

      const allMonths = [...new Set([...Object.keys(monthlyExpenses), ...Object.keys(monthlyIncome)])];
      const monthlyDataArray = allMonths
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-6)
        .map(month => ({
          month,
          pengeluaran: monthlyExpenses[month] || 0,
          pemasukan: monthlyIncome[month] || 0
        }));

      setMonthlyData(monthlyDataArray);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  const pieChartData = projects.map((project, idx) => ({
    name: project.name,
    value: project.totalExpense,
    percentage: statistics.totalExpenses > 0 ? ((project.totalExpense / statistics.totalExpenses) * 100).toFixed(1) : 0
  }));

  const barChartData = projects.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    Budget: project.project_value || 0,
    Pengeluaran: project.totalExpense
  }));

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Accounting Admin</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Dashboard Keuangan & Laporan Lengkap</p>
        </div>

        {/* Main Financial Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Saldo Kas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-lg sm:text-2xl font-bold ${
                statistics.saldoKas >= 0 ? 'text-green-700' : 'text-red-600'
              }`}>{formatCurrency(statistics.saldoKas)}</p>
              <p className="text-xs text-green-600 mt-1">Kas Masuk - Kas Keluar</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Laba Bersih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-lg sm:text-2xl font-bold ${
                statistics.labaBersih >= 0 ? 'text-blue-700' : 'text-red-600'
              }`}>{formatCurrency(statistics.labaBersih)}</p>
              <p className="text-xs text-blue-600 mt-1">Laba Bruto - Beban Operasional</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Aset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-bold text-purple-700">{formatCurrency(statistics.totalAset)}</p>
              <p className="text-xs text-purple-600 mt-1">Kas + Piutang + Persediaan + Aset Tetap</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-bold text-orange-700">{formatCurrency(statistics.totalPendapatan)}</p>
              <p className="text-xs text-orange-600 mt-1">Total Nilai Proyek</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Proyek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{statistics.projectCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Nilai Proyek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg font-bold text-blue-600">{formatCurrency(statistics.totalProjectValue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg font-bold text-red-600">{formatCurrency(statistics.totalExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sisa Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(statistics.totalBudgetRemaining)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estimasi PnL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-base sm:text-lg font-bold ${
                statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(statistics.totalProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Laporan Laba Rugi (P&L) */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Laporan Laba Rugi (P&L)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b-2 border-slate-200">
                <span className="text-sm sm:text-base font-semibold text-slate-700">Pendapatan</span>
                <span className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(plData.pendapatan)}</span>
              </div>
              <div className="flex justify-between items-center pl-4">
                <span className="text-xs sm:text-sm text-slate-600">Beban Pokok Penjualan</span>
                <span className="text-sm sm:text-base text-red-600">({formatCurrency(plData.bebanPokok)})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-sm sm:text-base font-semibold text-slate-700">Laba Bruto</span>
                <span className="text-base sm:text-lg font-bold text-blue-600">{formatCurrency(plData.labaBruto)}</span>
              </div>
              <div className="flex justify-between items-center pl-4">
                <span className="text-xs sm:text-sm text-slate-600">Beban Operasional</span>
                <span className="text-sm sm:text-base text-red-600">({formatCurrency(plData.bebanOperasional)})</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
                <span className="text-base sm:text-lg font-bold text-slate-800">Laba Bersih</span>
                <span className={`text-xl sm:text-2xl font-bold ${
                  plData.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>{formatCurrency(plData.labaBersih)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Neraca (Balance Sheet) */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Neraca (Balance Sheet)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Aset */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 border-b-2 pb-2">ASET</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Kas</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.aset.kas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Piutang</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.aset.piutang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Persediaan</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.aset.persediaan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Aset Tetap</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.aset.asetTetap)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-purple-200">
                    <span className="text-sm sm:text-base font-bold text-purple-700">Total Aset</span>
                    <span className="text-sm sm:text-base font-bold text-purple-700">{formatCurrency(neraca.aset.total)}</span>
                  </div>
                </div>
              </div>

              {/* Kewajiban */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 border-b-2 pb-2">KEWAJIBAN</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Hutang</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.kewajiban.hutang)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-purple-200">
                    <span className="text-sm sm:text-base font-bold text-purple-700">Total Kewajiban</span>
                    <span className="text-sm sm:text-base font-bold text-purple-700">{formatCurrency(neraca.kewajiban.total)}</span>
                  </div>
                </div>
              </div>

              {/* Ekuitas */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 border-b-2 pb-2">EKUITAS</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Modal</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.ekuitas.modal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-slate-600">Laba Ditahan</span>
                    <span className="text-xs sm:text-sm font-semibold">{formatCurrency(neraca.ekuitas.labaDitahan)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-purple-200">
                    <span className="text-sm sm:text-base font-bold text-purple-700">Total Ekuitas</span>
                    <span className="text-sm sm:text-base font-bold text-purple-700">{formatCurrency(neraca.ekuitas.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className="mt-6 p-4 bg-slate-100 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Aset</span>
                <span className="text-base font-bold text-slate-800">{formatCurrency(neraca.aset.total)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-semibold text-slate-700">Total Kewajiban + Ekuitas</span>
                <span className="text-base font-bold text-slate-800">{formatCurrency(neraca.kewajiban.total + neraca.ekuitas.total)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-300">
                <span className={`text-xs ${
                  Math.abs(neraca.aset.total - (neraca.kewajiban.total + neraca.ekuitas.total)) < 1 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {Math.abs(neraca.aset.total - (neraca.kewajiban.total + neraca.ekuitas.total)) < 1 
                    ? '✓ Neraca Balance' 
                    : '⚠ Neraca Tidak Balance'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Breakdown Pengeluaran per Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Budget vs Pengeluaran per Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Budget" fill="#3b82f6" />
                  <Bar dataKey="Pengeluaran" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Line Chart - Trend */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Trend Pemasukan & Pengeluaran (6 Bulan Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2} name="Pemasukan" />
                  <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Detail Proyek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b">
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Nama Proyek</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Tipe</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Budget</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Pengeluaran</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Sisa</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-700">Usage</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-slate-50">
                      <td className="px-3 py-3 font-medium text-slate-800">{project.name}</td>
                      <td className="px-3 py-3">
                        <span className="capitalize text-slate-600">{project.type}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-blue-600">
                        {formatCurrency(project.project_value)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-red-600">
                        {formatCurrency(project.totalExpense)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-green-600">
                        {formatCurrency(project.budgetRemaining)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.budgetUsage > 90 ? 'bg-red-100 text-red-700' :
                          project.budgetUsage > 70 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {project.budgetUsage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/projects/${project.id}`)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccountingAdmin;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, FileText, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import api from '../../utils/api';

const AccountingAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [statistics, setStatistics] = useState({
    totalProjectValue: 0,
    totalExpenses: 0,
    totalBudgetRemaining: 0,
    totalProfit: 0,
    projectCount: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all projects
      const projectsRes = await api.get('/projects');
      const projectsList = projectsRes.data;

      // Load transactions for all projects
      const transactionsRes = await api.get('/transactions');
      const allTransactions = transactionsRes.data;

      // Calculate statistics per project
      const projectsWithStats = projectsList.map(project => {
        const projectTransactions = allTransactions.filter(t => t.project_id === project.id);
        const totalExpense = projectTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
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
      const totalProfit = totalBudgetRemaining;

      setStatistics({
        totalProjectValue,
        totalExpenses,
        totalBudgetRemaining,
        totalProfit,
        projectCount: projectsList.length
      });

      // Prepare monthly trend data (last 6 months)
      const monthlyExpenses = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      allTransactions.forEach(transaction => {
        if (transaction.transaction_date) {
          const date = new Date(transaction.transaction_date);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + (transaction.total_amount || 0);
        }
      });

      const monthlyDataArray = Object.keys(monthlyExpenses)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-6)
        .map(month => ({
          month,
          pengeluaran: monthlyExpenses[month]
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

  // Prepare data for charts
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
          <p className="text-sm sm:text-base text-slate-600 mt-1">Dashboard Keuangan & Statistik Proyek</p>
        </div>

        {/* Statistics Cards */}
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
              <p className="text-lg sm:text-xl font-bold text-blue-600">{formatCurrency(statistics.totalProjectValue)}</p>
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
              <p className="text-lg sm:text-xl font-bold text-red-600">{formatCurrency(statistics.totalExpenses)}</p>
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
              <p className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(statistics.totalBudgetRemaining)}</p>
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
              <p className={`text-lg sm:text-xl font-bold ${statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(statistics.totalProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Pie Chart - Breakdown Pengeluaran per Proyek */}
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

          {/* Bar Chart - Budget vs Pengeluaran */}
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

        {/* Line Chart - Trend Pengeluaran */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Trend Pengeluaran Bulanan (6 Bulan Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="pengeluaran" stroke="#3b82f6" strokeWidth={2} name="Pengeluaran" />
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

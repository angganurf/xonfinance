import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { TrendingUp, DollarSign, Briefcase, PieChart as PieIcon } from 'lucide-react';

const AccountingDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [projectAllocation, setProjectAllocation] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, transRes, monthlyRes, allocRes] = await Promise.all([
        api.get('/financial/summary'),
        api.get('/transactions/recent'),
        api.get('/financial/monthly'),
        api.get('/financial/project-allocation')
      ]);
      
      setSummary(summaryRes.data);
      setTransactions(transRes.data);
      
      // Transform monthly data for charts
      const monthly = Object.keys(monthlyRes.data).map(month => ({
        month,
        revenue: monthlyRes.data[month].revenue,
        cogs: monthlyRes.data[month].cogs,
        opex: monthlyRes.data[month].opex,
        netProfit: monthlyRes.data[month].net_profit
      }));
      setMonthlyData(monthly);
      setProjectAllocation(allocRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="accounting-dashboard">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-600" data-testid="cash-balance-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Saldo Kas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="cash-balance-value">
                    Rp {summary?.cash_balance?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600" data-testid="net-profit-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Laba Bersih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="net-profit-value">
                    Rp {summary?.net_profit?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600" data-testid="total-assets-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Aset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="total-assets-value">
                    Rp {summary?.total_assets?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <Briefcase className="h-10 w-10 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600" data-testid="total-revenue-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="total-revenue-value">
                    Rp {summary?.total_revenue?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <PieIcon className="h-10 w-10 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Laba Bersih Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp ${value?.toLocaleString('id-ID')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="netProfit" stroke="#3b82f6" strokeWidth={2} name="Laba Bersih" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue, COGS & Opex</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp ${value?.toLocaleString('id-ID')}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="cogs" fill="#ef4444" name="COGS" />
                  <Bar dataKey="opex" fill="#f59e0b" name="Opex" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alokasi Anggaran Per Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rp ${value?.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto" data-testid="recent-transactions">
                {transactions.map((trans) => (
                  <div key={trans.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg" data-testid={`transaction-${trans.id}`}>
                    <div>
                      <p className="font-medium text-slate-800">{trans.description}</p>
                      <p className="text-sm text-slate-500">{trans.category}</p>
                    </div>
                    <p className="font-bold text-slate-800">Rp {trans.amount?.toLocaleString('id-ID')}</p>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-slate-500">Belum ada transaksi</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AccountingDashboard;
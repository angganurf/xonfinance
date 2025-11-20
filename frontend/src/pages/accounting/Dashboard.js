import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import ProjectProgressBar from '../../components/ProjectProgressBar';
import api from '../../utils/api';
import { TrendingUp, DollarSign, Briefcase, PieChart as PieIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const AccountingDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [projectAllocation, setProjectAllocation] = useState([]);
  const [projectsProgress, setProjectsProgress] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, transRes, monthlyRes, allocRes, progressRes] = await Promise.all([
        api.get('/financial/summary'),
        api.get('/transactions/recent'),
        api.get('/financial/monthly'),
        api.get('/financial/project-allocation'),
        api.get('/financial/projects-progress')
      ]);
      
      setSummary(summaryRes.data);
      setTransactions(transRes.data);
      setProjectsProgress(progressRes.data);
      
      // Transform monthly data for charts
      const monthly = Object.keys(monthlyRes.data).map(month => ({
        month,
        income: monthlyRes.data[month].income || 0,
        expenses: (monthlyRes.data[month].cogs || 0) + (monthlyRes.data[month].opex || 0),
        cogs: monthlyRes.data[month].cogs || 0,
        opex: monthlyRes.data[month].opex || 0,
        netProfit: monthlyRes.data[month].net_profit || 0
      }));
      setMonthlyData(monthly);
      setCashFlowData(monthly);
      setProjectAllocation(allocRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  const EXPENSE_COLORS = ['#ef4444', '#f97316'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="accounting-dashboard">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow" data-testid="cash-balance-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Saldo Kas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="cash-balance-value">
                    Rp {summary?.cash_balance?.toLocaleString('id-ID') || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Cash Balance</p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 hover:shadow-lg transition-shadow" data-testid="net-profit-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Laba Bersih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="net-profit-value">
                    Rp {summary?.net_profit?.toLocaleString('id-ID') || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Net Profit</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow" data-testid="total-assets-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Aset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="total-assets-value">
                    Rp {summary?.total_assets?.toLocaleString('id-ID') || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Total Assets</p>
                </div>
                <Briefcase className="h-10 w-10 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600 hover:shadow-lg transition-shadow" data-testid="total-revenue-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="total-revenue-value">
                    Rp {summary?.total_revenue?.toLocaleString('id-ID') || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Total Revenue</p>
                </div>
                <PieIcon className="h-10 w-10 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Progress Section */}
        {projectsProgress.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Progress Anggaran Proyek</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="projects-progress-section">
              {projectsProgress.map((project) => (
                <ProjectProgressBar key={project.project_id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Cash Flow Chart - Income vs Expenses */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              Arus Kas - Pemasukan vs Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  formatter={(value) => `Rp ${value?.toLocaleString('id-ID')}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  name="Pemasukan"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  name="Pengeluaran"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Profit Line Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Laba Bersih Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => `Rp ${value?.toLocaleString('id-ID')}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="netProfit" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    name="Laba Bersih"
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* COGS & Opex Bar Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Breakdown Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => `Rp ${value?.toLocaleString('id-ID')}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="cogs" fill="#ef4444" name="COGS" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="opex" fill="#f97316" name="Opex" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
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
                    label={(entry) => `${entry.name}: ${((entry.value / projectAllocation.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%`}
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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="recent-transactions">
                {transactions.map((trans) => {
                  const isIncome = trans.category === 'kas_masuk' || trans.category === 'uang_masuk';
                  return (
                    <div key={trans.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors" data-testid={`transaction-${trans.id}`}>
                      <div className="flex items-center gap-3">
                        {isIncome ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{trans.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{trans.category}</span>
                            {trans.project_name && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">{trans.project_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className={`font-bold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+' : '-'}Rp {trans.amount?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
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
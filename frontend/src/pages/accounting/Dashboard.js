import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import api from '../../utils/api';
import { TrendingDown, DollarSign, Building2, Eye, ShoppingCart, Hammer, Users } from 'lucide-react';
import { toast } from 'sonner';

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);
  const [weeklyExpenses, setWeeklyExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [projectExpenses, setProjectExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get all transactions and projects
      const [transRes, projectsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/projects')
      ]);
      
      const transactions = transRes.data;
      const projects = projectsRes.data;
      
      // Filter only expense transactions for bahan, upah, alat
      // Categories: 'bahan' (material), 'upah' (labor), 'alat' (equipment)
      const expenseCategories = ['bahan', 'upah', 'alat'];
      const expenseTransactions = transactions.filter(t => 
        expenseCategories.includes(t.category)
      );
      
      // Calculate total expenses (transaksi keluar saja)
      const total = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalExpenses(total);
      
      // Calculate daily, weekly, monthly expenses
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const dailyTotal = expenseTransactions.reduce((sum, t) => {
        const transDate = new Date(t.transaction_date);
        const transDay = new Date(transDate.getFullYear(), transDate.getMonth(), transDate.getDate());
        return transDay.getTime() === today.getTime() ? sum + (t.amount || 0) : sum;
      }, 0);
      
      const weeklyTotal = expenseTransactions.reduce((sum, t) => {
        const transDate = new Date(t.transaction_date);
        return transDate >= weekAgo ? sum + (t.amount || 0) : sum;
      }, 0);
      
      const monthlyTotal = expenseTransactions.reduce((sum, t) => {
        const transDate = new Date(t.transaction_date);
        return transDate >= monthAgo ? sum + (t.amount || 0) : sum;
      }, 0);
      
      setDailyExpenses(dailyTotal);
      setWeeklyExpenses(weeklyTotal);
      setMonthlyExpenses(monthlyTotal);
      
      // Calculate expenses per project
      const projectExpensesMap = {};
      
      expenseTransactions.forEach(trans => {
        if (!projectExpensesMap[trans.project_id]) {
          projectExpensesMap[trans.project_id] = {
            bahan: 0,
            upah: 0,
            alat: 0,
            total: 0
          };
        }
        
        const amount = trans.amount || 0;
        projectExpensesMap[trans.project_id][trans.category] += amount;
        projectExpensesMap[trans.project_id].total += amount;
      });
      
      // Combine with project data
      const projectsWithExpenses = projects.map(project => ({
        ...project,
        expenses: projectExpensesMap[project.id] || {
          bahan: 0,
          upah: 0,
          alat: 0,
          total: 0
        }
      }));
      
      // Sort by total expenses (highest first)
      projectsWithExpenses.sort((a, b) => b.expenses.total - a.expenses.total);
      
      setProjectExpenses(projectsWithExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="accounting-dashboard">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Accounting</h2>
          <p className="text-slate-600">Informasi pengeluaran proyek</p>
        </div>

        {/* Total Expenses Card */}
        <Card className="shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <span>Total Transaksi Keluar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-slate-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-red-600 mb-3">
                  Rp {totalExpenses.toLocaleString('id-ID')}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span>Pembelanjaan Bahan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Upah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hammer className="h-4 w-4 text-orange-600" />
                    <span>Pembelian Alat</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Period-based Expenses Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Expenses */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-700">
                Transaksi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded w-2/3"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  Rp {dailyExpenses.toLocaleString('id-ID')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Expenses */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-700">
                Transaksi 7 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded w-2/3"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  Rp {weeklyExpenses.toLocaleString('id-ID')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-700">
                Transaksi 30 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded w-2/3"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-orange-600">
                  Rp {monthlyExpenses.toLocaleString('id-ID')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project List with Expenses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">Daftar Proyek & Pengeluaran</h3>
            <span className="text-sm text-slate-500">
              {projectExpenses.length} proyek
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projectExpenses.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center">
                <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Proyek</h3>
                <p className="text-slate-600">Belum ada proyek yang tersedia.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projectExpenses.map(project => (
                <Card 
                  key={project.id} 
                  className="shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/projects/${project.id}`)}
                >
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-slate-800 mb-1">{project.name}</h4>
                          <p className="text-sm text-slate-500">{project.type} • {project.location || 'Lokasi tidak tersedia'}</p>
                          
                          {/* Breakdown expenses */}
                          <div className="flex items-center gap-4 mt-2">
                            {project.expenses.bahan > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <ShoppingCart className="h-3 w-3 text-blue-600" />
                                <span className="text-slate-600">Bahan:</span>
                                <span className="font-semibold text-blue-600">
                                  Rp {project.expenses.bahan.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            {project.expenses.upah > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Users className="h-3 w-3 text-green-600" />
                                <span className="text-slate-600">Upah:</span>
                                <span className="font-semibold text-green-600">
                                  Rp {project.expenses.upah.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            {project.expenses.alat > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Hammer className="h-3 w-3 text-orange-600" />
                                <span className="text-slate-600">Alat:</span>
                                <span className="font-semibold text-orange-600">
                                  Rp {project.expenses.alat.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1">Total Pengeluaran</p>
                          <p className="text-2xl font-bold text-red-600">
                            Rp {project.expenses.total.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/projects/${project.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AccountingDashboard;

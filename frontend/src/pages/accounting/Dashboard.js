import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../utils/api';
import { TrendingDown, DollarSign, Building2 } from 'lucide-react';

const AccountingDashboard = () => {
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get all transactions and calculate total outflow
      const transRes = await api.get('/transactions');
      const transactions = transRes.data;
      
      // Calculate total outflow (expenses)
      const total = transactions.reduce((sum, t) => {
        if (t.type === 'expense') {
          return sum + (t.total_amount || 0);
        }
        return sum;
      }, 0);
      
      setTotalOutflow(total);
      
      // Get project count
      const projectsRes = await api.get('/projects');
      setProjectCount(projectsRes.data.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="accounting-dashboard">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Accounting</h2>
          <p className="text-slate-600">Informasi keuangan proyek</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Outflow Card */}
          <Card className="shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <span>Total Outflow</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-slate-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-red-600 mb-2">
                    Rp {totalOutflow.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-slate-500">Total pengeluaran semua proyek</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Count Card */}
          <Card className="shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <span>Total Proyek</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-blue-600 mb-2">
                    {projectCount}
                  </p>
                  <p className="text-sm text-slate-500">Proyek aktif</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-slate-50">
          <CardContent className="py-8">
            <div className="text-center">
              <DollarSign className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Dashboard Accounting Sederhana</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Dashboard ini menampilkan informasi outflow (pengeluaran) dari semua proyek. 
                Untuk melihat detail inventory, silakan akses menu Inventory.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccountingDashboard;

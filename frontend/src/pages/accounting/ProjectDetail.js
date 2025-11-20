import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [projectId]);

  const loadFinancialData = async () => {
    try {
      const response = await api.get(`/financial/project/${projectId}`);
      setFinancial(response.data);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="p-6">Loading...</div></Layout>;
  if (!financial) return <Layout><div className="p-6">Project not found</div></Layout>;

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  // Group transactions by category
  const categoryData = {};
  financial.transactions.forEach(t => {
    if (!categoryData[t.category]) {
      categoryData[t.category] = 0;
    }
    categoryData[t.category] += t.amount;
  });

  const pieData = Object.keys(categoryData).map(key => ({
    name: key,
    value: categoryData[key]
  }));

  return (
    <Layout>
      <div className="space-y-6" data-testid="project-detail-page">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/accounting/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{financial.project.name}</h2>
            <p className="text-sm text-slate-600">{financial.project.type} - {financial.project.location}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pemasukan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">Rp {financial.total_income?.toLocaleString('id-ID')}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">Rp {financial.total_expense?.toLocaleString('id-ID')}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${financial.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Rp {financial.net?.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Biaya per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: Rp ${entry.value?.toLocaleString('id-ID')}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {financial.transactions.slice(0, 10).map((trans) => (
                  <div key={trans.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{trans.description}</p>
                      <p className="text-xs text-slate-500">{trans.category} • {new Date(trans.transaction_date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <p className={`font-bold ${trans.category === 'uang_masuk' ? 'text-green-600' : 'text-red-600'}`}>
                      {trans.category === 'uang_masuk' ? '+' : '-'}Rp {trans.amount?.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;
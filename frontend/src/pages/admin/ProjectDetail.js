import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Building2, MapPin, Calendar, DollarSign, FileText, TrendingUp, Users, Package } from 'lucide-react';
import api from '../../utils/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [statistics, setStatistics] = useState({
    transactions: { count: 0, total: 0 },
    inventory: { count: 0 },
    tasks: { count: 0, completed: 0 },
    rab: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectDetail();
    loadStatistics();
  }, [id]);

  const loadProjectDetail = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Gagal memuat detail proyek');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // Load transactions
      const transRes = await api.get(`/transactions?project_id=${id}`);
      const transactions = transRes.data;
      const totalExpense = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

      // Load inventory
      const invRes = await api.get(`/inventory?project_id=${id}`);
      
      // Load tasks
      const tasksRes = await api.get(`/tasks?project_id=${id}`);
      const tasks = tasksRes.data;
      const completedTasks = tasks.filter(t => t.status === 'completed');

      // Load RAB
      const rabRes = await api.get(`/rabs?project_id=${id}`);
      const rab = rabRes.data.length > 0 ? rabRes.data[0] : null;

      setStatistics({
        transactions: { count: transactions.length, total: totalExpense },
        inventory: { count: invRes.data.length },
        tasks: { count: tasks.length, completed: completedTasks.length },
        rab: rab
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      planning: 'bg-yellow-100 text-yellow-800',
      on_hold: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ongoing',
      completed: 'Finish',
      planning: 'Planning',
      on_hold: 'On Hold'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-slate-500 mb-4">Proyek tidak ditemukan</p>
          <Button onClick={() => navigate('/admin/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Proyek
          </Button>
        </div>
      </Layout>
    );
  }

  const taskProgress = statistics.tasks.count > 0 
    ? (statistics.tasks.completed / statistics.tasks.count) * 100 
    : 0;

  const budgetUsage = project.project_value > 0
    ? (statistics.transactions.total / project.project_value) * 100
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/projects')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
              <p className="text-slate-600 mt-1">Detail Proyek & Statistik</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tipe Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-xl font-bold capitalize">{project.type}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Lokasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <span className="text-lg font-semibold">{project.location || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tanggal Mulai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">{formatDate(project.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Fase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-lg font-semibold capitalize">{project.phase || 'pelaksanaan'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Overview Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-slate-600">Nilai Proyek</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(project.project_value)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-slate-600">Total Pengeluaran</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(statistics.transactions.total)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-slate-600">Sisa Budget</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(project.project_value - statistics.transactions.total)}
                </span>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Penggunaan Budget</span>
                  <span className="text-sm font-bold">{budgetUsage.toFixed(1)}%</span>
                </div>
                <Progress value={budgetUsage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                RAB & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-slate-600">Status RAB</span>
                {statistics.rab ? (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statistics.rab.status === 'approved' ? 'bg-green-100 text-green-800' :
                    statistics.rab.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {statistics.rab.status === 'approved' ? 'Approved' : 
                     statistics.rab.status === 'draft' ? 'Draft' : 
                     statistics.rab.status}
                  </span>
                ) : (
                  <span className="text-red-600 text-sm">Belum ada RAB</span>
                )}
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-slate-600">Total RAB</span>
                <span className="text-xl font-bold">
                  {statistics.rab ? formatCurrency(statistics.rab.total_price) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-slate-600">Design Progress</span>
                <span className="text-xl font-bold text-blue-600">{project.design_progress || 0}%</span>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Progress Desain</span>
                  <span className="text-sm font-bold">{project.design_progress || 0}%</span>
                </div>
                <Progress value={project.design_progress || 0} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-blue-600">{statistics.transactions.count}</p>
                <p className="text-sm text-slate-600">Total Transaksi</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(statistics.transactions.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">{statistics.tasks.count}</p>
                <p className="text-sm text-slate-600">Total Tasks</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Completed</span>
                  <span className="text-lg font-semibold">{statistics.tasks.completed}</span>
                </div>
                <Progress value={taskProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-purple-600">{statistics.inventory.count}</p>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-sm text-slate-500">Material & Peralatan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {project.description && (
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProjectDetail;

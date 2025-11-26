import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  FileText, 
  Box, 
  FileImage, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Plus,
  Edit
} from 'lucide-react';
import api from '../../utils/api';

const PlanningProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    loadOverview();
  }, [id]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/planning-projects/${id}/overview`);
      setOverview(res.data);
    } catch (error) {
      toast.error('Gagal memuat data proyek');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      not_started: { label: 'Belum Mulai', className: 'bg-slate-100 text-slate-700' },
      in_progress: { label: 'Sedang Dikerjakan', className: 'bg-orange-100 text-orange-700' },
      completed: { label: 'Selesai', className: 'bg-green-100 text-green-700' }
    };
    const variant = variants[status] || variants.not_started;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === 'in_progress') return <AlertCircle className="h-5 w-5 text-orange-600" />;
    return <Circle className="h-5 w-5 text-slate-400" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Memuat data...</p>
        </div>
      </Layout>
    );
  }

  if (!overview) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Data tidak ditemukan</p>
        </div>
      </Layout>
    );
  }

  const { project, overall_progress, tasks } = overview;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/planning-projects')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
              <p className="text-sm text-slate-500">{project.type} • {project.location || 'Lokasi tidak ditentukan'}</p>
            </div>
          </div>
          <Badge className="bg-orange-100 text-orange-700 px-4 py-2">PERENCANAAN</Badge>
        </div>

        {/* Overall Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{overall_progress}%</span>
                <span className="text-sm text-slate-500">
                  {tasks.filter(t => t.status === 'completed').length} dari {tasks.length} tugas selesai
                </span>
              </div>
              <Progress value={overall_progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RAB Task */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RAB</CardTitle>
                    <p className="text-sm text-slate-500">Rencana Anggaran Biaya</p>
                  </div>
                </div>
                {getStatusIcon(overview.rab.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-lg font-bold text-blue-600">{overview.rab.progress}%</span>
                </div>
                <Progress value={overview.rab.progress} className="h-2" />
                
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(overview.rab.status)}
                  {overview.rab.data && overview.rab.data.length > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/estimator/rab/${overview.rab.data[0].id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit RAB
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate('/estimator/dashboard')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Buat RAB
                    </Button>
                  )}
                </div>
                
                {overview.rab.items && overview.rab.items.length > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    {overview.rab.items.length} item dalam RAB
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modeling 3D Task */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Box className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Modeling 3D</CardTitle>
                    <p className="text-sm text-slate-500">Model 3 Dimensi</p>
                  </div>
                </div>
                {getStatusIcon(overview.modeling_3d.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-lg font-bold text-purple-600">{overview.modeling_3d.progress}%</span>
                </div>
                <Progress value={overview.modeling_3d.progress} className="h-2" />
                
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(overview.modeling_3d.status)}
                  {overview.modeling_3d.data && overview.modeling_3d.data.length > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/planning/dashboard')}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Modeling
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate('/planning/dashboard')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Modeling
                    </Button>
                  )}
                </div>
                
                {overview.modeling_3d.data && overview.modeling_3d.data.length > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    {overview.modeling_3d.data.length} file modeling
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shop Drawing Task */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileImage className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Gambar Kerja</CardTitle>
                    <p className="text-sm text-slate-500">Shop Drawing</p>
                  </div>
                </div>
                {getStatusIcon(overview.shop_drawing.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-lg font-bold text-green-600">{overview.shop_drawing.progress}%</span>
                </div>
                <Progress value={overview.shop_drawing.progress} className="h-2" />
                
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(overview.shop_drawing.status)}
                  {overview.shop_drawing.data && overview.shop_drawing.data.length > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/planning/dashboard')}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Gambar Kerja
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate('/planning/dashboard')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Gambar Kerja
                    </Button>
                  )}
                </div>
                
                {overview.shop_drawing.data && overview.shop_drawing.data.length > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    {overview.shop_drawing.data.length} file gambar kerja
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Task */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Time Schedule</CardTitle>
                    <p className="text-sm text-slate-500">Jadwal Pekerjaan</p>
                  </div>
                </div>
                {getStatusIcon(overview.schedule.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-lg font-bold text-orange-600">{overview.schedule.progress}%</span>
                </div>
                <Progress value={overview.schedule.progress} className="h-2" />
                
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(overview.schedule.status)}
                  {overview.schedule.items && overview.schedule.items.length > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/projects/${id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Schedule
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/admin/projects/${id}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Schedule
                    </Button>
                  )}
                </div>
                
                {overview.schedule.items && overview.schedule.items.length > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    {overview.schedule.completed_items || 0} dari {overview.schedule.total_items} task selesai
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="font-medium text-slate-800">{task.name}</p>
                      {task.items_count !== undefined && (
                        <p className="text-xs text-slate-500">{task.items_count} items</p>
                      )}
                      {task.count !== undefined && (
                        <p className="text-xs text-slate-500">{task.count} files</p>
                      )}
                      {task.total_items !== undefined && (
                        <p className="text-xs text-slate-500">
                          {task.completed_items}/{task.total_items} selesai
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(task.status)}
                    <span className="text-sm font-bold text-blue-600 min-w-[50px] text-right">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PlanningProjectDetail;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Slider } from '../../components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
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
  Edit,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const PlanningProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [editProgressDialog, setEditProgressDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [updating, setUpdating] = useState(false);

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

  const openEditProgress = (taskType, currentProgress) => {
    const taskNames = {
      rab: 'RAB',
      modeling_3d: 'Modeling 3D',
      shop_drawing: 'Gambar Kerja',
      schedule: 'Time Schedule'
    };
    setSelectedTask({ type: taskType, name: taskNames[taskType] });
    setProgressValue(currentProgress);
    setEditProgressDialog(true);
  };

  const handleUpdateProgress = async () => {
    if (!selectedTask) return;
    
    setUpdating(true);
    try {
      await api.patch(`/planning-projects/${id}/task-progress?task_type=${selectedTask.type}&progress=${progressValue}`);
      toast.success(`Progress ${selectedTask.name} berhasil diupdate ke ${progressValue}%`);
      setEditProgressDialog(false);
      loadOverview();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Gagal mengupdate progress');
    } finally {
      setUpdating(false);
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

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Check if user can edit progress
  const canEditProgress = () => {
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    return userRoles.includes('admin') || 
           userRoles.includes('project_planning_team') || 
           userRoles.includes('site_supervisor');
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/planning-projects')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{project.name}</h2>
              <p className="text-xs sm:text-sm text-slate-500">{project.type} • {project.location || 'Lokasi tidak ditentukan'}</p>
            </div>
          </div>
          <Badge className="bg-orange-100 text-orange-700 px-3 sm:px-4 py-1.5 sm:py-2">PERENCANAAN</Badge>
        </div>

        {/* Overall Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Progress Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold text-blue-600">{overall_progress}%</span>
                <span className="text-xs sm:text-sm text-slate-500">
                  {tasks.filter(t => t.status === 'completed').length} dari {tasks.length} tugas selesai
                </span>
              </div>
              <Progress value={overall_progress} className="h-2 sm:h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* RAB Task */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-lg">RAB</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">Rencana Anggaran Biaya</p>
                  </div>
                </div>
                {getStatusIcon(overview.rab.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Horizontal Progress Bar with Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Progress Pekerjaan:</span>
                    <span className="text-sm sm:text-lg font-bold text-blue-600">{overview.rab.progress}%</span>
                  </div>
                  <div className="relative w-full h-6 sm:h-8 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(overview.rab.progress)} transition-all duration-500 flex items-center justify-end pr-2 sm:pr-3`}
                      style={{ width: `${overview.rab.progress}%` }}
                    >
                      {overview.rab.progress > 10 && (
                        <span className="text-white text-xs sm:text-sm font-bold">{overview.rab.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                  {getStatusBadge(overview.rab.status)}
                  <div className="flex gap-2">
                    {canEditProgress() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditProgress('rab', overview.rab.progress)}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Update Progress
                      </Button>
                    )}
                  </div>
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
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                    <Box className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-lg">Modeling 3D</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">Model 3 Dimensi</p>
                  </div>
                </div>
                {getStatusIcon(overview.modeling_3d.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Horizontal Progress Bar with Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Progress Pekerjaan:</span>
                    <span className="text-sm sm:text-lg font-bold text-purple-600">{overview.modeling_3d.progress}%</span>
                  </div>
                  <div className="relative w-full h-6 sm:h-8 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(overview.modeling_3d.progress)} transition-all duration-500 flex items-center justify-end pr-2 sm:pr-3`}
                      style={{ width: `${overview.modeling_3d.progress}%` }}
                    >
                      {overview.modeling_3d.progress > 10 && (
                        <span className="text-white text-xs sm:text-sm font-bold">{overview.modeling_3d.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                  {getStatusBadge(overview.modeling_3d.status)}
                  <div className="flex gap-2">
                    {canEditProgress() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditProgress('modeling_3d', overview.modeling_3d.progress)}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Update Progress
                      </Button>
                    )}
                  </div>
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
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <FileImage className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-lg">Gambar Kerja</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">Shop Drawing</p>
                  </div>
                </div>
                {getStatusIcon(overview.shop_drawing.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Horizontal Progress Bar with Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Progress Pekerjaan:</span>
                    <span className="text-sm sm:text-lg font-bold text-green-600">{overview.shop_drawing.progress}%</span>
                  </div>
                  <div className="relative w-full h-6 sm:h-8 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(overview.shop_drawing.progress)} transition-all duration-500 flex items-center justify-end pr-2 sm:pr-3`}
                      style={{ width: `${overview.shop_drawing.progress}%` }}
                    >
                      {overview.shop_drawing.progress > 10 && (
                        <span className="text-white text-xs sm:text-sm font-bold">{overview.shop_drawing.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                  {getStatusBadge(overview.shop_drawing.status)}
                  <div className="flex gap-2">
                    {canEditProgress() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditProgress('shop_drawing', overview.shop_drawing.progress)}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Update Progress
                      </Button>
                    )}
                  </div>
                </div>
                
                {overview.shop_drawing.data && overview.shop_drawing.data.length > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    {overview.shop_drawing.data.length} file gambar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Task */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-lg">Time Schedule</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">Jadwal Pelaksanaan</p>
                  </div>
                </div>
                {getStatusIcon(overview.schedule.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Horizontal Progress Bar with Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Progress Pekerjaan:</span>
                    <span className="text-sm sm:text-lg font-bold text-amber-600">{overview.schedule.progress}%</span>
                  </div>
                  <div className="relative w-full h-6 sm:h-8 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(overview.schedule.progress)} transition-all duration-500 flex items-center justify-end pr-2 sm:pr-3`}
                      style={{ width: `${overview.schedule.progress}%` }}
                    >
                      {overview.schedule.progress > 10 && (
                        <span className="text-white text-xs sm:text-sm font-bold">{overview.schedule.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                  {getStatusBadge(overview.schedule.status)}
                  <div className="flex gap-2">
                    {canEditProgress() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditProgress('schedule', overview.schedule.progress)}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Update Progress
                      </Button>
                    )}
                  </div>
                </div>
                
                {overview.schedule.items && overview.schedule.items.length > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    {overview.schedule.items.length} item jadwal
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Progress Dialog */}
      <Dialog open={editProgressDialog} onOpenChange={setEditProgressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Update Progress {selectedTask?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Geser slider untuk mengatur persentase progress pekerjaan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Progress Value Display */}
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-bold text-blue-600">{progressValue}%</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">Persentase Progress</p>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <Slider
                value={[progressValue]}
                onValueChange={(value) => setProgressValue(value[0])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="relative w-full h-8 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(progressValue)} transition-all duration-300 flex items-center justify-center`}
                style={{ width: `${progressValue}%` }}
              >
                {progressValue > 0 && (
                  <span className="text-white text-sm font-bold">{progressValue}%</span>
                )}
              </div>
            </div>

            {/* Status Info */}
            <div className="text-center text-xs sm:text-sm text-slate-600">
              {progressValue === 0 && 'Belum Mulai'}
              {progressValue > 0 && progressValue < 100 && 'Sedang Dikerjakan'}
              {progressValue === 100 && '✓ Selesai'}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditProgressDialog(false)}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateProgress}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              {updating ? 'Menyimpan...' : 'Simpan Progress'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PlanningProjectDetail;

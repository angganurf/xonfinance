import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import { Slider } from '../../components/ui/slider';
import { toast } from 'sonner';
import { Briefcase, FileText, Calendar, TrendingUp, Edit, CheckCircle, Clock, AlertCircle, Plus, Pencil, Box, Trash2, FileImage } from 'lucide-react';
import api from '../../utils/api';

const PlanningTeamDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState([]);
  const [rabs, setRabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [bulkEditDialog, setBulkEditDialog] = useState(false);
  const [editTaskProgressDialog, setEditTaskProgressDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRAB, setSelectedRAB] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [taskProgress, setTaskProgress] = useState(0);
  const [tempProgress, setTempProgress] = useState({});
  const [showUpdateButton, setShowUpdateButton] = useState({});
  const [progressReport, setProgressReport] = useState('');
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'interior',
    description: '',
    location: '',
    project_value: 0
  });

  useEffect(() => {
    loadOverview();
    loadRABs();
  }, []);

  const loadOverview = async () => {
    try {
      console.log('[Planning Dashboard] Loading overview...');
      const res = await api.get('/planning/overview');
      console.log('[Planning Dashboard] Overview loaded:', res.data.length, 'projects');
      setOverview(res.data);
    } catch (error) {
      console.error('[Planning Dashboard] Error loading overview:', error);
      toast.error('Gagal memuat data overview');
    } finally {
      setLoading(false);
    }
  };

  const loadRABs = async () => {
    try {
      const res = await api.get('/rabs');
      setRabs(res.data);
    } catch (error) {
      console.error('Error loading RABs:', error);
    }
  };

  const handleRABSelection = (rabId) => {
    if (!rabId) {
      setSelectedRAB(null);
      setFormData({ ...formData, project_value: 0 });
      return;
    }

    const rab = rabs.find(r => r.id === rabId);
    if (rab) {
      setSelectedRAB(rab);
      setFormData({ 
        ...formData, 
        project_value: rab.total_price || 0,
        name: rab.project_name || formData.name
      });
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    try {
      console.log('[Planning Dashboard] Creating planning project:', formData);
      const res = await api.post('/planning-projects', formData);
      console.log('[Planning Dashboard] Planning project created:', res.data);
      toast.success('Pekerjaan perencanaan berhasil dibuat!');
      setCreateDialog(false);
      setFormData({
        name: '',
        type: 'interior',
        description: '',
        location: '',
        project_value: 0
      });
      setSelectedRAB(null);
      console.log('[Planning Dashboard] Reloading overview...');
      loadOverview();
    } catch (error) {
      console.error('[Planning Dashboard] Error creating project:', error);
      toast.error('Gagal membuat pekerjaan perencanaan');
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await api.patch(`/planning-projects/${selectedProject.project.id}/design-progress?progress=${newProgress}`);
      toast.success('Progress berhasil diupdate!');
      setEditDialog(false);
      loadOverview();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Gagal mengupdate progress');
    }
  };

  const handleBulkUpdateProgress = async () => {
    try {
      await Promise.all(
        selectedProjects.map(projectId => 
          api.patch(`/planning-projects/${projectId}/design-progress?progress=${bulkProgress}`)
        )
      );
      toast.success(`Progress ${selectedProjects.length} proyek berhasil diupdate!`);
      setBulkEditDialog(false);
      setSelectedProjects([]);
      loadOverview();
    } catch (error) {
      console.error('Error bulk updating progress:', error);
      toast.error('Gagal mengupdate progress');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Hapus ${selectedProjects.length} proyek yang dipilih?`)) return;

    try {
      await Promise.all(
        selectedProjects.map(projectId => 
          api.delete(`/planning-projects/${projectId}`)
        )
      );
      toast.success(`${selectedProjects.length} proyek berhasil dihapus!`);
      setSelectedProjects([]);
      loadOverview();
    } catch (error) {
      console.error('Error bulk deleting projects:', error);
      toast.error('Gagal menghapus proyek');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProjects(overview.map(o => o.project.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (projectId, checked) => {
    if (checked) {
      setSelectedProjects([...selectedProjects, projectId]);
    } else {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    }
  };

  const openEditTaskProgress = (projectId, taskType, currentProgress) => {
    const taskNames = {
      rab: 'RAB',
      modeling_3d: 'Modeling 3D',
      shop_drawing: 'Gambar Kerja',
      schedule: 'Time Schedule'
    };
    setSelectedProject({ project: { id: projectId } });
    setSelectedTask({ type: taskType, name: taskNames[taskType] });
    setTaskProgress(currentProgress);
    setEditTaskProgressDialog(true);
  };

  const handleProgressBarClick = (e, projectId, taskType, taskName, currentProgress) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.round((x / rect.width) * 100);
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    // Langsung buka dialog dengan progress yang diklik
    setSelectedProject({ project: { id: projectId } });
    setSelectedTask({ type: taskType, name: taskName });
    setTaskProgress(clampedPercentage);
    setProgressReport('');
    setEditTaskProgressDialog(true);
  };

  const handleUpdateTaskProgress = async () => {
    if (!selectedProject || !selectedTask) return;
    
    if (!progressReport.trim()) {
      toast.error('Laporan progress wajib diisi');
      return;
    }
    
    setUpdating(true);
    try {
      await api.patch(`/planning-projects/${selectedProject.project.id}/task-progress?task_type=${selectedTask.type}&progress=${taskProgress}&report=${encodeURIComponent(progressReport)}`);
      toast.success(`Progress ${selectedTask.name} berhasil diupdate ke ${taskProgress}%`);
      
      setEditTaskProgressDialog(false);
      setProgressReport('');
      loadOverview();
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Gagal mengupdate progress');
    } finally {
      setUpdating(false);
    }
  };

  const getRABStatusColor = (status) => {
    const colors = {
      'draft': 'bg-slate-100 text-slate-800',
      'bidding_process': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRABStatusLabel = (status) => {
    const labels = {
      'draft': 'Draft',
      'bidding_process': 'Bidding',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const totalProjects = overview.length;
  const projectsWithRAB = overview.filter(o => o.rab).length;
  const projectsWithSchedule = overview.filter(o => o.schedule).length;
  const avgProgress = overview.length > 0 
    ? Math.round(overview.reduce((sum, o) => sum + (o.design_progress || 0), 0) / overview.length)
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard Planning Team</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Monitoring progress desain, RAB, dan time schedule</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                📋 Project Perencanaan (Tahap Sebelum Pembangunan)
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {selectedProjects.length > 0 && (
              <>
                <Button 
                  onClick={() => setBulkEditDialog(true)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                  size="sm"
                >
                  <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Update ({selectedProjects.length})
                </Button>
                <Button 
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                  size="sm"
                >
                  <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Hapus ({selectedProjects.length})
                </Button>
              </>
            )}
            <Button onClick={() => {
              setCreateDialog(true);
              setSelectedRAB(null);
              setFormData({
                name: '',
                type: 'interior',
                description: '',
                location: '',
                project_value: 0
              });
            }} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm" size="sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Tambah Pekerjaan
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-800 flex items-center gap-2">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" /> Total Proyek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalProjects}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-800 flex items-center gap-2">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" /> RAB Selesai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{projectsWithRAB}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-800 flex items-center gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" /> Time Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">{projectsWithSchedule}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-800 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> Avg Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900">{avgProgress}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Daftar Pekerjaan Perencanaan</CardTitle>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  Project ini hanya visible untuk Planning Team. Setelah RAB di-approve, project akan pindah ke fase Pelaksanaan.
                </p>
              </div>
              {overview.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProjects.length === overview.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-xs sm:text-sm text-slate-600">Pilih Semua</Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {overview.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Briefcase className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                <p className="text-sm">Belum ada proyek</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overview.map((item) => (
                  <Card key={item.project.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2 sm:gap-3 flex-1">
                            <Checkbox
                              checked={selectedProjects.includes(item.project.id)}
                              onCheckedChange={(checked) => handleSelectProject(item.project.id, checked)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">{item.project.name}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                  item.project.type === 'interior' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {item.project.type === 'interior' ? 'Interior' : 'Arsitektur'}
                                </span>
                                <span className="text-xs sm:text-sm text-slate-600">
                                  {item.project.location || 'Lokasi tidak tersedia'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-600">Nilai Proyek</p>
                            <p className="text-sm sm:text-lg font-bold text-slate-800">
                              {formatCurrency(item.project.project_value)}
                            </p>
                          </div>
                        </div>

                        {/* Task Progress Grid with Horizontal Bars */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 border-t">
                          {/* RAB Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">RAB</span>
                              </div>
                              <span className="text-sm sm:text-base font-bold text-blue-600">{item.rab_progress || 0}%</span>
                            </div>
                            <div 
                              className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                              onClick={(e) => handleProgressBarClick(e, item.project.id, 'rab', 'RAB', item.rab_progress || 0)}
                              title="Klik di bar untuk update progress"
                            >
                              <div 
                                className={`h-full ${getProgressColor(item.rab_progress || 0)} transition-all duration-300 flex items-center justify-end pr-2`}
                                style={{ width: `${item.rab_progress || 0}%` }}
                              >
                                {(item.rab_progress || 0) > 10 && (
                                  <span className="text-white text-xs font-bold">{item.rab_progress || 0}%</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center italic">Klik di bar untuk update progress</p>
                          </div>

                          {/* Modeling 3D Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-purple-600" />
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">Modeling 3D</span>
                              </div>
                              <span className="text-sm sm:text-base font-bold text-purple-600">{item.modeling_3d_progress || 0}%</span>
                            </div>
                            <div 
                              className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                              onClick={(e) => handleProgressBarClick(e, item.project.id, 'modeling_3d', 'Modeling 3D', item.modeling_3d_progress || 0)}
                              title="Klik di bar untuk update progress"
                            >
                              <div 
                                className={`h-full ${getProgressColor(item.modeling_3d_progress || 0)} transition-all duration-300 flex items-center justify-end pr-2`}
                                style={{ width: `${item.modeling_3d_progress || 0}%` }}
                              >
                                {(item.modeling_3d_progress || 0) > 10 && (
                                  <span className="text-white text-xs font-bold">{item.modeling_3d_progress || 0}%</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center italic">Klik di bar untuk update progress</p>
                          </div>

                          {/* Shop Drawing Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-green-600" />
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">Gambar Kerja</span>
                              </div>
                              <span className="text-sm sm:text-base font-bold text-green-600">{item.shop_drawing_progress || 0}%</span>
                            </div>
                            <div 
                              className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-400 transition-all"
                              onClick={(e) => handleProgressBarClick(e, item.project.id, 'shop_drawing', 'Gambar Kerja', item.shop_drawing_progress || 0)}
                              title="Klik di bar untuk update progress"
                            >
                              <div 
                                className={`h-full ${getProgressColor(item.shop_drawing_progress || 0)} transition-all duration-300 flex items-center justify-end pr-2`}
                                style={{ width: `${item.shop_drawing_progress || 0}%` }}
                              >
                                {(item.shop_drawing_progress || 0) > 10 && (
                                  <span className="text-white text-xs font-bold">{item.shop_drawing_progress || 0}%</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center italic">Klik di bar untuk update progress</p>
                          </div>

                          {/* Time Schedule Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-600" />
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">Time Schedule</span>
                              </div>
                              <span className="text-sm sm:text-base font-bold text-amber-600">{item.schedule_progress || 0}%</span>
                            </div>
                            <div 
                              className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all"
                              onClick={(e) => handleProgressBarClick(e, item.project.id, 'schedule', 'Time Schedule', item.schedule_progress || 0)}
                              title="Klik di bar untuk update progress"
                            >
                              <div 
                                className={`h-full ${getProgressColor(item.schedule_progress || 0)} transition-all duration-300 flex items-center justify-end pr-2`}
                                style={{ width: `${item.schedule_progress || 0}%` }}
                              >
                                {(item.schedule_progress || 0) > 10 && (
                                  <span className="text-white text-xs font-bold">{item.schedule_progress || 0}%</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center italic">Klik di bar untuk update progress</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs remain the same... */}
      {/* Edit Task Progress Dialog */}
      <Dialog open={editTaskProgressDialog} onOpenChange={setEditTaskProgressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Update Progress {selectedTask?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Konfirmasi progress dan tambahkan laporan pekerjaan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center bg-blue-50 p-4 rounded-lg">
              <p className="text-4xl sm:text-5xl font-bold text-blue-600">{taskProgress}%</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">Progress yang akan diupdate</p>
            </div>

            <div className="relative w-full h-8 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(taskProgress)} transition-all duration-300 flex items-center justify-center`}
                style={{ width: `${taskProgress}%` }}
              >
                {taskProgress > 0 && (
                  <span className="text-white text-sm font-bold">{taskProgress}%</span>
                )}
              </div>
            </div>

            <div className="text-center text-xs sm:text-sm text-slate-600">
              {taskProgress === 0 && '⚪ Belum Mulai'}
              {taskProgress > 0 && taskProgress < 100 && '🔄 Sedang Dikerjakan'}
              {taskProgress === 100 && '✅ Selesai'}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="progress-report" className="text-sm font-semibold">
                Laporan Progress <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="progress-report"
                value={progressReport}
                onChange={(e) => setProgressReport(e.target.value)}
                placeholder="Jelaskan pekerjaan yang sudah dilakukan, kendala, atau catatan penting lainnya..."
                className="w-full border rounded-md px-3 py-2 min-h-[100px] text-sm"
                required
              />
              <p className="text-xs text-slate-500">Laporan wajib diisi untuk update progress</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditTaskProgressDialog(false)}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateTaskProgress}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              {updating ? 'Menyimpan...' : 'Simpan Progress'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Original dialogs... */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress Desain</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div>
              <Label>Progress Desain (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value) || 0)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkEditDialog} onOpenChange={setBulkEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress Desain ({selectedProjects.length} proyek)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Progress Desain (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={bulkProgress}
                onChange={(e) => setBulkProgress(parseInt(e.target.value) || 0)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkEditDialog(false)}>Batal</Button>
              <Button onClick={handleBulkUpdateProgress}>Simpan</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pekerjaan Perencanaan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <Label>Nama Proyek</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Contoh: Renovasi Rumah Bapak John"
              />
            </div>
            <div>
              <Label>Tipe Proyek</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="interior">Interior</option>
                <option value="arsitektur">Arsitektur</option>
              </select>
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Contoh: Jakarta Selatan"
              />
            </div>
            <div>
              <Label>Nilai Proyek</Label>
              <Input
                type="number"
                value={formData.project_value}
                onChange={(e) => setFormData({...formData, project_value: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Deskripsi (Optional)</Label>
              <textarea
                className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi proyek..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>Batal</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Buat Proyek</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PlanningTeamDashboard;

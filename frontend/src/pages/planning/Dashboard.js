import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { Briefcase, FileText, Calendar, TrendingUp, Edit, CheckCircle, Clock, AlertCircle, Plus, Pencil, Box, Trash2 } from 'lucide-react';
import api from '../../utils/api';

const PlanningTeamDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState([]);
  const [rabs, setRabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [bulkEditDialog, setBulkEditDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRAB, setSelectedRAB] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [newProgress, setNewProgress] = useState(0);
  const [bulkProgress, setBulkProgress] = useState(0);
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
      // Auto-fill nilai proyek dari total RAB
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
      console.log('[Planning Dashboard] Creating project:', formData);
      const res = await api.post('/projects', formData);
      console.log('[Planning Dashboard] Project created:', res.data);
      toast.success('Project perencanaan berhasil dibuat!');
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
      await loadOverview();
      console.log('[Planning Dashboard] Overview reloaded successfully');
    } catch (error) {
      console.error('[Planning Dashboard] Error creating project:', error);
      toast.error('Gagal membuat project');
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedProject) return;
    
    try {
      await api.patch(`/projects/${selectedProject.project.id}/design-progress`, {
        progress: parseInt(newProgress)
      });
      
      toast.success('Progress desain berhasil diupdate!');
      setEditDialog(false);
      setSelectedProject(null);
      loadOverview();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Gagal update progress');
    }
  };

  // Multi-select handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProjects(overview.map(item => item.project.id));
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

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Pilih minimal satu pekerjaan untuk dihapus');
      return;
    }

    if (!window.confirm(`Hapus ${selectedProjects.length} pekerjaan yang dipilih?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedProjects.map(projectId => api.delete(`/projects/${projectId}`))
      );
      
      toast.success(`${selectedProjects.length} pekerjaan berhasil dihapus!`);
      setSelectedProjects([]);
      loadOverview();
    } catch (error) {
      console.error('Error deleting projects:', error);
      toast.error('Gagal menghapus beberapa pekerjaan');
    }
  };

  const handleBulkUpdateProgress = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Pilih minimal satu pekerjaan untuk diupdate');
      return;
    }

    try {
      await Promise.all(
        selectedProjects.map(projectId => 
          api.patch(`/projects/${projectId}/design-progress`, {
            progress: parseInt(bulkProgress)
          })
        )
      );
      
      toast.success(`Progress ${selectedProjects.length} pekerjaan berhasil diupdate!`);
      setBulkEditDialog(false);
      setSelectedProjects([]);
      setBulkProgress(0);
      loadOverview();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Gagal update progress beberapa pekerjaan');
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
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

  // Calculate stats
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
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Planning Team</h2>
            <p className="text-sm text-slate-600 mt-1">Monitoring progress desain, RAB, dan time schedule</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                📋 Project Perencanaan (Tahap Sebelum Pembangunan)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedProjects.length > 0 && (
              <>
                <Button 
                  onClick={() => setBulkEditDialog(true)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="mr-2 h-4 w-4" /> Update Progress ({selectedProjects.length})
                </Button>
                <Button 
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedProjects.length})
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
            }} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Tambah Pekerjaan Perencanaan
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Total Proyek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900">{totalProjects}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <FileText className="h-4 w-4" /> RAB Selesai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900">{projectsWithRAB}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Time Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-900">{projectsWithSchedule}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Avg Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-900">{avgProgress}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Pekerjaan Perencanaan</CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  Project ini hanya visible untuk Planning Team. Setelah RAB di-approve, project akan pindah ke fase Pelaksanaan dan visible untuk semua role.
                </p>
              </div>
              {overview.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProjects.length === overview.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm text-slate-600">Pilih Semua</Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {overview.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Briefcase className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                <p>Belum ada proyek</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overview.map((item) => (
                  <Card key={item.project.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800">{item.project.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.project.type === 'interior' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.project.type === 'interior' ? 'Interior' : 'Arsitektur'}
                              </span>
                              <span className="text-sm text-slate-600">
                                {item.project.location || 'Lokasi tidak tersedia'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600">Nilai Proyek</p>
                            <p className="text-lg font-bold text-slate-800">
                              {formatCurrency(item.project.project_value)}
                            </p>
                          </div>
                        </div>

                        {/* Progress Desain */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-slate-800">Progress Desain</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-blue-600">
                                {item.design_progress}%
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProject(item);
                                  setNewProgress(item.design_progress);
                                  setEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Progress 
                            value={item.design_progress} 
                            className="h-3"
                          />
                        </div>

                        {/* RAB, Modeling 3D, Shop Drawing & Schedule Info */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t">
                          {/* RAB Info */}
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 font-medium">Pengerjaan RAB</p>
                              {item.rab ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRABStatusColor(item.rab.status)}`}>
                                    {getRABStatusLabel(item.rab.status)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/estimator/rab/${item.rab.id}`)}
                                  >
                                    Lihat RAB →
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-xs text-orange-600">Belum dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/estimator?createRAB=true&projectId=${item.project.id}&projectName=${encodeURIComponent(item.project.name)}&projectType=${item.project.type}&location=${encodeURIComponent(item.project.location || '')}`)}
                                  >
                                    Buat RAB →
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Modeling 3D Info */}
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Box className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 font-medium">Modeling 3D</p>
                              {item.modeling_3d ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-xs text-green-600 font-medium">Sudah dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/drafter/modeling-3d/${item.modeling_3d.id}`)}
                                  >
                                    Lihat →
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-xs text-orange-600">Belum dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/drafter/modeling-3d/create?project=${item.project.id}`)}
                                  >
                                    Buat Modeling 3D →
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Shop Drawing Info */}
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Pencil className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 font-medium">Gambar Kerja</p>
                              {item.shop_drawing ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-xs text-green-600 font-medium">Sudah dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/drafter/shop-drawing/${item.shop_drawing.id}`)}
                                  >
                                    Lihat →
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-xs text-orange-600">Belum dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/drafter/shop-drawing/create?project=${item.project.id}`)}
                                  >
                                    Buat Shop Drawing →
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Schedule Info */}
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 font-medium">Time Schedule</p>
                              {item.schedule ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-xs text-green-600 font-medium">Sudah dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/supervisor/schedule?project=${item.project.id}`)}
                                  >
                                    Lihat →
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-xs text-orange-600">Belum dibuat</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => navigate(`/supervisor/schedule?project=${item.project.id}`)}
                                  >
                                    Buat Schedule →
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-600">
                          <span>Dibuat: {formatDate(item.project.created_at)}</span>
                          <span>Dibuat oleh: {item.project.created_by}</span>
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

      {/* Edit Progress Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress Desain</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="font-medium text-slate-800">{selectedProject.project.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Progress saat ini: <span className="font-semibold">{selectedProject.design_progress}%</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Progress Baru (0-100%)
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-blue-600">{newProgress}%</span>
                </div>
                <Progress value={newProgress} className="h-3 mt-3" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateProgress}>
              Update Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pekerjaan Perencanaan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            {/* RAB Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Label htmlFor="rab_selection" className="text-blue-800">Pilih dari RAB (Opsional)</Label>
              <select
                id="rab_selection"
                value={selectedRAB?.id || ''}
                onChange={(e) => handleRABSelection(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-2"
              >
                <option value="">-- Tidak pilih dari RAB --</option>
                {rabs.map((rab) => (
                  <option key={rab.id} value={rab.id}>
                    {rab.project_name} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(rab.total_price || 0)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-1">
                💡 Jika pilih dari RAB, nama proyek dan nilai proyek akan otomatis terisi
              </p>
            </div>

            <div>
              <Label htmlFor="name">Nama Proyek *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Renovasi Rumah Pak Budi"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Tipe Proyek *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="interior">Interior</option>
                <option value="arsitektur">Arsitektur</option>
              </select>
            </div>

            <div>
              <Label htmlFor="location">Lokasi *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Contoh: Jakarta Selatan"
                required
              />
            </div>

            <div>
              <Label htmlFor="project_value">Nilai Proyek (Rp)</Label>
              <Input
                id="project_value"
                type="number"
                value={formData.project_value}
                onChange={(e) => setFormData({ ...formData, project_value: parseFloat(e.target.value) || 0 })}
                placeholder="0 (bisa dikosongkan jika belum ada RAB)"
                disabled={selectedRAB !== null}
              />
              <p className="text-xs text-slate-500 mt-1">
                {selectedRAB 
                  ? "✓ Nilai proyek diambil dari RAB yang dipilih" 
                  : "Bisa dikosongkan dulu, nanti bisa di-update ketika RAB sudah dibuat"}
              </p>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat tentang proyek..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PlanningTeamDashboard;

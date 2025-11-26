import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { Briefcase, FileText, Calendar, TrendingUp, Edit, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import api from '../../utils/api';

const PlanningTeamDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState([]);
  const [rabs, setRabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRAB, setSelectedRAB] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
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
      const res = await api.get('/planning/overview');
      setOverview(res.data);
    } catch (error) {
      console.error('Error loading overview:', error);
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
      const res = await api.post('/projects', formData);
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
      loadOverview();
    } catch (error) {
      console.error('Error creating project:', error);
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
          <Button onClick={() => setCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Buat Project Baru
          </Button>
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
            <CardTitle>Daftar Pekerjaan Desain (Project Perencanaan)</CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              Project ini hanya visible untuk Planning Team. Setelah RAB di-approve, project akan pindah ke fase Pelaksanaan dan visible untuk semua role.
            </p>
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

                        {/* RAB & Schedule Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
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
                                    onClick={() => navigate('/estimator')}
                                  >
                                    Buat RAB →
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
            <DialogTitle>Buat Project Perencanaan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
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
              <Label htmlFor="project_value">Nilai Proyek (Rp) *</Label>
              <Input
                id="project_value"
                type="number"
                value={formData.project_value}
                onChange={(e) => setFormData({ ...formData, project_value: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 100000000"
                required
              />
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

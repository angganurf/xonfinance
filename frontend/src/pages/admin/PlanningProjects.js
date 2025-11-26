import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Building2, Edit, Trash2, MoreVertical, Eye, CheckSquare, Square } from 'lucide-react';
import api from '../../utils/api';

const PlanningProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('planning');
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'interior',
    description: '',
    contract_date: '',
    duration: '',
    location: '',
    project_value: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsRes = await api.get('/planning-projects');
      
      // Get planning progress for each project
      const projectsWithProgress = await Promise.all(
        projectsRes.data.map(async (project) => {
          try {
            const overviewRes = await api.get(`/planning-projects/${project.id}/overview`);
            return {
              ...project,
              overall_progress: overviewRes.data.overall_progress || 0,
              tasks: overviewRes.data.tasks || []
            };
          } catch (error) {
            return {
              ...project,
              overall_progress: 0,
              tasks: []
            };
          }
        })
      );
      
      setProjects(projectsWithProgress);
      setSelectedProjects([]);
    } catch (error) {
      toast.error('Gagal memuat proyek perencanaan');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProjects(projects.map(p => p.id));
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
    if (selectedProjects.length === 0) return;
    
    try {
      await api.post('/planning-projects/bulk/delete', {
        project_ids: selectedProjects
      });
      toast.success(`${selectedProjects.length} proyek berhasil dihapus`);
      setBulkDeleteDialog(false);
      loadProjects();
    } catch (error) {
      toast.error('Gagal menghapus proyek');
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedProjects.length === 0) return;
    
    try {
      await api.post('/planning-projects/bulk/update', {
        project_ids: selectedProjects,
        updates: { status: bulkStatus }
      });
      toast.success(`${selectedProjects.length} proyek berhasil diupdate`);
      setBulkStatusDialog(false);
      loadProjects();
    } catch (error) {
      toast.error('Gagal update status proyek');
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        type: project.type,
        description: project.description || '',
        contract_date: project.contract_date ? project.contract_date.split('T')[0] : '',
        duration: project.duration || '',
        location: project.location || '',
        project_value: project.project_value || ''
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        type: 'interior',
        description: '',
        contract_date: '',
        duration: '',
        location: '',
        project_value: ''
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        project_value: formData.project_value ? parseFloat(formData.project_value) : 0
      };

      if (editingProject) {
        await api.patch(`/planning-projects/${editingProject.id}`, data);
        toast.success('Proyek perencanaan berhasil diupdate');
      } else {
        await api.post('/planning-projects', data);
        toast.success('Proyek perencanaan berhasil dibuat');
      }
      
      setOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      toast.error(editingProject ? 'Gagal update proyek' : 'Gagal membuat proyek');
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await api.delete(`/planning-projects/${projectToDelete.id}`);
      toast.success('Proyek perencanaan berhasil dihapus');
      setDeleteDialog(false);
      setProjectToDelete(null);
      loadProjects();
    } catch (error) {
      toast.error('Gagal menghapus proyek perencanaan');
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await api.patch(`/planning-projects/${projectId}`, { status: newStatus });
      toast.success(`Status berhasil diubah ke ${newStatus}`);
      loadProjects();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const allSelected = projects.length > 0 && selectedProjects.length === projects.length;
  const someSelected = selectedProjects.length > 0 && selectedProjects.length < projects.length;

  return (
    <Layout>
      <div className="space-y-6" data-testid="projects-page">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Daftar Proyek Perencanaan</h2>
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className="h-5 w-5"
                />
                <Label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer">
                  Pilih Semua ({selectedProjects.length}/{projects.length})
                </Label>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedProjects.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setBulkStatusDialog(true)}
                  data-testid="bulk-edit-btn"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Status ({selectedProjects.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setBulkDeleteDialog(true)}
                  data-testid="bulk-delete-btn"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus ({selectedProjects.length})
                </Button>
              </>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} data-testid="add-project-btn">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Proyek
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="project-dialog">
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nama Proyek</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      data-testid="project-name-input" 
                    />
                  </div>
                  <div>
                    <Label>Tipe</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger data-testid="project-type-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interior">Interior</SelectItem>
                        <SelectItem value="arsitektur">Arsitektur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nilai Proyek (Rp)</Label>
                    <Input 
                      type="number" 
                      value={formData.project_value} 
                      onChange={(e) => setFormData({...formData, project_value: e.target.value})} 
                      data-testid="project-value-input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      data-testid="project-description-input" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tanggal Kontrak</Label>
                      <Input 
                        type="date" 
                        value={formData.contract_date} 
                        onChange={(e) => setFormData({...formData, contract_date: e.target.value})} 
                        data-testid="project-contract-date-input" 
                      />
                    </div>
                    <div>
                      <Label>Durasi (hari)</Label>
                      <Input 
                        type="number" 
                        value={formData.duration} 
                        onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                        data-testid="project-duration-input" 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Lokasi</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                      data-testid="project-location-input" 
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                    <Button type="submit" data-testid="submit-project-btn">{editingProject ? 'Update' : 'Simpan'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
          {projects.map((project) => {
            const progress = projectsProgress.find(p => p.project_id === project.id);
            const isSelected = selectedProjects.includes(project.id);
            
            return (
            <Card 
              key={project.id} 
              className={`hover:shadow-lg transition-all relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              data-testid={`project-card-${project.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectProject(project.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5"
                    />
                    <div 
                      className="p-3 bg-blue-100 rounded-lg cursor-pointer" 
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                    >
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                          PERENCANAAN
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{project.type}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        data-testid={`project-menu-${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/projects/${project.id}`);
                        }} 
                        data-testid={`view-project-${project.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(project);
                        }} 
                        data-testid={`edit-project-${project.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                          setDeleteDialog(true);
                        }}
                        className="text-red-600"
                        data-testid={`delete-project-${project.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {project.project_value > 0 && (
                    <p><span className="font-medium">Nilai:</span> Rp {project.project_value?.toLocaleString('id-ID')}</p>
                  )}
                  <p><span className="font-medium">Lokasi:</span> {project.location || '-'}</p>
                  <p><span className="font-medium">Durasi:</span> {project.duration || '-'} hari</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-medium">Status:</span>
                    <Select 
                      value={project.status} 
                      onValueChange={(value) => handleStatusChange(project.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8" data-testid={`status-select-${project.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Progress Bars */}
                  {progress && progress.project_value > 0 && (
                    <div className="mt-4 pt-3 border-t space-y-3">
                      {/* Income Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">Diterima</span>
                          <span className="text-xs font-medium text-green-600">
                            {progress.income_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress.income_percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Expenses Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">Dibelanjakan</span>
                          <span className="text-xs font-medium text-red-600">
                            {progress.expenses_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress.expenses_percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Balance */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Saldo:</span>
                        <span className={`font-bold ${
                          progress.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          Rp {progress.balance?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {projects.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada proyek</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Tambah Proyek Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Single Project Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent data-testid="delete-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Proyek?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus proyek "{projectToDelete?.name}"? 
              Semua data terkait (RAB, Transaksi, Schedule, Tasks) akan ikut terhapus. 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedProjects.length} Proyek?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedProjects.length} proyek yang dipilih? 
              Semua data terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Status Dialog */}
      <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status {selectedProjects.length} Proyek</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status Baru</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialog(false)}>Batal</Button>
            <Button onClick={handleBulkUpdateStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PlanningProjects;

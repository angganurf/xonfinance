import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import api from '../../utils/api';
import { FileText, Edit, Trash2, MoreVertical, Plus, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const RABList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rabs, setRabs] = useState([]);
  const [filteredRabs, setFilteredRabs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRab, setSelectedRab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
    
    // Check if we need to auto-open create RAB dialog from Planning Dashboard
    const createRAB = searchParams.get('createRAB');
    const projectName = searchParams.get('projectName');
    const projectType = searchParams.get('projectType');
    const projectId = searchParams.get('projectId');
    const location = searchParams.get('location');
    
    if (createRAB === 'true' && projectId) {
      setFormData({
        project_id: projectId,
        name: projectName ? decodeURIComponent(projectName) : '',
        description: '',
        notes: location ? `Lokasi: ${decodeURIComponent(location)}` : ''
      });
      setAddDialog(true);
      
      // Clean up URL params
      searchParams.delete('createRAB');
      searchParams.delete('projectName');
      searchParams.delete('projectType');
      searchParams.delete('projectId');
      searchParams.delete('location');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    filterRABs();
  }, [rabs, statusFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rabsRes, projectsRes] = await Promise.all([
        api.get('/rabs'),
        api.get('/planning-projects')
      ]);
      
      setRabs(rabsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filterRABs = () => {
    let filtered = [...rabs];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rab => rab.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(rab => 
        rab.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rab.client_name && rab.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Sort by status priority and creation date
    const statusOrder = { 'draft': 1, 'review': 2, 'approved': 3, 'rejected': 4 };
    filtered.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    setFilteredRabs(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_id) {
      toast.error('Pilih proyek terlebih dahulu');
      return;
    }
    
    try {
      const project = projects.find(p => p.id === formData.project_id);
      if (!project) {
        toast.error('Proyek tidak ditemukan');
        return;
      }
      
      const rabData = {
        project_id: formData.project_id,
        project_name: project.name,
        project_type: project.type,
        client_name: project.client_name || '',
        location: project.location || '',
        name: formData.name || `RAB - ${project.name}`,
        description: formData.description || '',
        notes: formData.notes || '',
        status: 'draft'
      };
      
      const response = await api.post('/rabs', rabData);
      toast.success('RAB berhasil dibuat');
      setAddDialog(false);
      setFormData({ project_id: '', name: '', description: '', notes: '' });
      
      if (response.data && response.data.id) {
        navigate(`/estimator/rab/${response.data.id}`);
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Error creating RAB:', error);
      toast.error('Gagal membuat RAB');
    }
  };

  const handleDelete = async () => {
    if (!selectedRab) return;
    
    try {
      await api.delete(`/rabs/${selectedRab.id}`);
      await api.delete(`/rab-items/rab/${selectedRab.id}`);
      toast.success('RAB berhasil dihapus');
      setDeleteDialog(false);
      setSelectedRab(null);
      loadData();
    } catch (error) {
      console.error('Error deleting RAB:', error);
      toast.error('Gagal menghapus RAB');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: { label: 'Draft', icon: Clock, className: 'bg-slate-100 text-slate-700' },
      review: { label: 'Review', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700' }
    };
    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variant.className}`}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </span>
    );
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

  const getStatusCounts = () => {
    return {
      total: rabs.length,
      draft: rabs.filter(r => r.status === 'draft').length,
      review: rabs.filter(r => r.status === 'review').length,
      approved: rabs.filter(r => r.status === 'approved').length,
      rejected: rabs.filter(r => r.status === 'rejected').length
    };
  };

  const stats = getStatusCounts();

  return (
    <Layout>
      <div className="space-y-6" data-testid="rab-list">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Daftar RAB</h2>
            <p className="text-sm text-slate-600 mt-1">Kelola Rencana Anggaran Biaya (RAB) proyek</p>
          </div>
          <Button onClick={() => setAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buat RAB Baru
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total RAB</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-600">{stats.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.review}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* RAB List Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama proyek atau klien..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-slate-500">Memuat data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-slate-600">
                      <th className="pb-3 font-semibold">Nama Proyek</th>
                      <th className="pb-3 font-semibold">Tipe</th>
                      <th className="pb-3 font-semibold">Klien</th>
                      <th className="pb-3 font-semibold">Lokasi</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Dibuat</th>
                      <th className="pb-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRabs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500">
                          <FileText className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                          <p>Belum ada RAB</p>
                          <p className="text-sm mt-1">Klik "Buat RAB Baru" untuk membuat RAB pertama</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRabs.map((rab) => (
                        <tr key={rab.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 font-medium">{rab.project_name}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rab.project_type === 'interior' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {rab.project_type === 'interior' ? 'Interior' : 'Arsitektur'}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-slate-600">{rab.client_name || '-'}</td>
                          <td className="py-3 text-sm text-slate-600">{rab.location || '-'}</td>
                          <td className="py-3">{getStatusBadge(rab.status)}</td>
                          <td className="py-3 text-sm text-slate-600">{formatDate(rab.created_at)}</td>
                          <td className="py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/estimator/rab/${rab.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit RAB
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedRab(rab);
                                    setDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add RAB Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah RAB Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Proyek *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih proyek perencanaan" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Nama RAB (Opsional)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Kosongkan untuk auto-generate dari nama proyek"
              />
            </div>
            
            <div>
              <Label>Deskripsi (Opsional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deskripsi RAB"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Catatan tambahan"
                rows={2}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialog(false)}>
                Batal
              </Button>
              <Button type="submit">
                Buat RAB
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus RAB?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus RAB "{selectedRab?.project_name}"? 
              Semua item pekerjaan dalam RAB ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default RABList;

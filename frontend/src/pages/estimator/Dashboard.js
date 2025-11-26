import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { FileText, Briefcase, Plus, Edit, Trash2, MoreVertical, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import api from '../../utils/api';

const EstimatorDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rabs, setRabs] = useState([]);
  const [filteredRabs, setFilteredRabs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRab, setSelectedRab] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [formData, setFormData] = useState({
    project_name: '',
    project_type: 'interior',
    client_name: '',
    location: ''
  });

  useEffect(() => {
    loadRABs();
    
    // Check if we need to auto-open create RAB dialog from Planning Dashboard
    const createRAB = searchParams.get('createRAB');
    const projectName = searchParams.get('projectName');
    const projectType = searchParams.get('projectType');
    const projectId = searchParams.get('projectId');
    const location = searchParams.get('location');
    
    if (createRAB === 'true' && projectName) {
      // Decode and auto-fill form data
      setFormData({
        project_name: decodeURIComponent(projectName),
        project_type: projectType || 'interior',
        client_name: '',
        location: location ? decodeURIComponent(location) : ''
      });
      
      // Open dialog
      setOpen(true);
      
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

  const loadRABs = async () => {
    try {
      const res = await api.get('/rabs');
      setRabs(res.data);
    } catch (error) {
      console.error('Error loading RABs:', error);
      toast.error('Gagal memuat daftar RAB');
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
    
    const statusOrder = { 'bidding_process': 1, 'draft': 2, 'rejected': 3, 'approved': 4 };
    filtered.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    setFilteredRabs(filtered);
  };

  const handleCreateRAB = async (e) => {
    e.preventDefault();
    
    try {
      const res = await api.post('/rabs', formData);
      toast.success('RAB berhasil dibuat!');
      setOpen(false);
      setFormData({
        project_name: '',
        project_type: 'interior',
        client_name: '',
        location: ''
      });
      loadRABs();
      
      // Navigate to RAB editor
      navigate(`/estimator/rab/${res.data.id}`);
    } catch (error) {
      console.error('Error creating RAB:', error);
      toast.error('Gagal membuat RAB');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRab) return;
    
    try {
      const data = { status: newStatus };
      if (newStatus === 'rejected') {
        data.rejected_reason = rejectedReason;
      }
      
      await api.patch(`/rabs/${selectedRab.id}/status`, data);
      
      if (newStatus === 'approved') {
        toast.success('RAB berhasil di-approve dan project otomatis dibuat!');
      } else {
        toast.success(`Status RAB berhasil diubah ke ${getStatusLabel(newStatus)}`);
      }
      
      setStatusDialog(false);
      setSelectedRab(null);
      setNewStatus('');
      setRejectedReason('');
      loadRABs();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal mengubah status RAB');
    }
  };

  const handleDeleteRAB = async () => {
    if (!selectedRab) return;
    
    try {
      await api.delete(`/rabs/${selectedRab.id}`);
      toast.success('RAB berhasil dihapus');
      setDeleteDialog(false);
      setSelectedRab(null);
      loadRABs();
    } catch (error) {
      console.error('Error deleting RAB:', error);
      toast.error('Gagal menghapus RAB');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Draft',
      'bidding_process': 'Bidding Process',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-slate-100 text-slate-800',
      'bidding_process': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'draft': <FileText className="h-4 w-4" />,
      'bidding_process': <Clock className="h-4 w-4" />,
      'approved': <CheckCircle className="h-4 w-4" />,
      'rejected': <XCircle className="h-4 w-4" />
    };
    return icons[status] || null;
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
      bidding: rabs.filter(r => r.status === 'bidding_process').length,
      approved: rabs.filter(r => r.status === 'approved').length,
      rejected: rabs.filter(r => r.status === 'rejected').length
    };
  };

  const stats = getStatusCounts();

  return (
    <Layout>
      <div className="space-y-6" data-testid="estimator-dashboard">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Estimator</h2>
            <p className="text-sm text-slate-600 mt-1">Kelola Rencana Anggaran Biaya (RAB) proyek</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buat RAB Baru
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <CardTitle className="text-sm font-medium text-yellow-600">Bidding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.bidding}</p>
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

        {/* RAB List */}
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
                    <SelectItem value="bidding_process">Bidding Process</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(rab.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rab.status)}`}>
                              {getStatusLabel(rab.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-slate-600">{formatDate(rab.created_at)}</td>
                        <td className="py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/estimator/rab/${rab.id}`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit RAB
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedRab(rab);
                                setNewStatus(rab.status);
                                setStatusDialog(true);
                              }}>
                                <FileText className="mr-2 h-4 w-4" /> Ubah Status
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedRab(rab);
                                  setDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
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
          </CardContent>
        </Card>
      </div>

      {/* Create RAB Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          // Reset form when dialog is closed
          setFormData({
            project_name: '',
            project_type: 'interior',
            client_name: '',
            location: ''
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat RAB Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRAB} className="space-y-4">
            {formData.project_name && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">📋 Data dari Planning Dashboard</p>
                <p className="text-xs text-blue-600 mt-1">
                  Data proyek sudah terisi otomatis. Silakan isi Nama Klien secara manual.
                </p>
              </div>
            )}
            
            <div>
              <Label>Nama Proyek *</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                placeholder="Contoh: Renovasi Rumah Bapak Andi"
                required
              />
            </div>

            <div>
              <Label>Tipe Proyek</Label>
              <Select 
                value={formData.project_type} 
                onValueChange={(v) => setFormData({...formData, project_type: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="arsitektur">Arsitektur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nama Klien</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                placeholder="Nama klien/pemilik (isi manual)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Silakan isi nama klien secara manual
              </p>
            </div>

            <div>
              <Label>Lokasi</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Lokasi proyek"
              />
              {formData.location && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Lokasi otomatis terisi dari Planning Dashboard
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Buat RAB
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status RAB</DialogTitle>
          </DialogHeader>
          {selectedRab && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-800">{selectedRab.project_name}</p>
                <p className="text-xs text-slate-600 mt-1">Status saat ini: {getStatusLabel(selectedRab.status)}</p>
              </div>

              <div>
                <Label>Status Baru *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="bidding_process">Bidding Process</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>ℹ️ Perhatian:</strong> Dengan approve RAB ini, project baru akan otomatis dibuat dan tersedia di semua role.
                  </p>
                </div>
              )}

              {selectedRab.status === 'approved' && newStatus !== 'approved' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Peringatan:</strong> Dengan mengubah status dari Approved, project yang sudah dibuat akan dihapus dari semua role.
                  </p>
                </div>
              )}

              {newStatus === 'rejected' && (
                <div>
                  <Label>Alasan Penolakan</Label>
                  <Input
                    value={rejectedReason}
                    onChange={(e) => setRejectedReason(e.target.value)}
                    placeholder="Masukkan alasan penolakan..."
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus RAB?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus RAB "{selectedRab?.project_name}"? 
              Semua item RAB juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRAB} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default EstimatorDashboard;
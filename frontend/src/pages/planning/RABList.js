import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import api from '../../utils/api';
import { FileText, Edit, Trash2, MoreVertical, Plus, Search, CheckCircle, Clock, XCircle, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

const RABList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rabs, setRabs] = useState([]);
  const [filteredRabs, setFilteredRabs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRabs, setSelectedRabs] = useState([]);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('draft');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRab, setSelectedRab] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRABs();
  }, [rabs, statusFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const rabsRes = await api.get('/rabs');
      setRabs(rabsRes.data);
    } catch (error) {
      console.error('Error loading RABs:', error);
      toast.error('Gagal memuat data RAB');
    } finally {
      setLoading(false);
    }
  };

  const filterRABs = () => {
    let filtered = rabs;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rab => rab.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(rab =>
        rab.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rab.client_name && rab.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rab.location && rab.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredRabs(filtered);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRabs(filteredRabs.map(rab => rab.id));
    } else {
      setSelectedRabs([]);
    }
  };

  const handleSelectRab = (rabId, checked) => {
    if (checked) {
      setSelectedRabs([...selectedRabs, rabId]);
    } else {
      setSelectedRabs(selectedRabs.filter(id => id !== rabId));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Hapus ${selectedRabs.length} RAB yang dipilih?`)) return;

    try {
      await Promise.all(
        selectedRabs.map(rabId => api.delete(`/rabs/${rabId}`))
      );
      toast.success(`${selectedRabs.length} RAB berhasil dihapus`);
      setSelectedRabs([]);
      loadData();
    } catch (error) {
      console.error('Error bulk deleting RABs:', error);
      toast.error('Gagal menghapus RAB');
    }
  };

  const handleBulkUpdateStatus = async () => {
    try {
      await Promise.all(
        selectedRabs.map(rabId => 
          api.patch(`/rabs/${rabId}/status`, { status: bulkStatus })
        )
      );
      toast.success(`Status ${selectedRabs.length} RAB berhasil diupdate`);
      setBulkStatusDialog(false);
      setSelectedRabs([]);
      loadData();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('Gagal mengupdate status RAB');
    }
  };

  const handleDeleteSingle = async () => {
    if (!selectedRab) return;

    try {
      await api.delete(`/rabs/${selectedRab.id}`);
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
      draft: { label: 'Draft', className: 'bg-slate-100 text-slate-800', icon: Clock },
      bidding_process: { label: 'Bidding', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </Badge>
    );
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
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Daftar RAB</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Rencana Anggaran Biaya</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {selectedRabs.length > 0 && (
              <>
                <Button 
                  onClick={() => setBulkStatusDialog(true)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                  size="sm"
                >
                  <CheckSquare className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Ubah Status ({selectedRabs.length})
                </Button>
                <Button 
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                  size="sm"
                >
                  <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Hapus ({selectedRabs.length})
                </Button>
              </>
            )}
            <Button 
              onClick={() => navigate('/planning/rab/new')}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
              size="sm"
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Buat RAB Baru
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama proyek, klien, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="bidding_process">Bidding</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{rabs.length}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Total RAB</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {rabs.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {rabs.filter(r => r.status === 'bidding_process').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Bidding</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-600">
                  {rabs.filter(r => r.status === 'draft').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Draft</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RAB List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Daftar RAB</CardTitle>
              {filteredRabs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRabs.length === filteredRabs.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-xs sm:text-sm text-slate-600">Pilih Semua</Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredRabs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                <p className="text-sm">
                  {searchQuery || statusFilter !== 'all' ? 'Tidak ada RAB yang sesuai filter' : 'Belum ada RAB'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b-2">
                    <tr>
                      <th className="px-3 py-3 text-left w-12">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold">Nama Proyek</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold">Tipe</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold">Klien</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold">Lokasi</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold">Total RAB</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold">Status</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold">Tanggal</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRabs.map((rab) => (
                      <tr 
                        key={rab.id} 
                        className={`border-b hover:bg-blue-50 transition-colors ${
                          selectedRabs.includes(rab.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRabs.includes(rab.id)}
                            onCheckedChange={(checked) => handleSelectRab(rab.id, checked)}
                          />
                        </td>
                        <td 
                          className="px-3 py-3 font-medium cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          {rab.project_name}
                        </td>
                        <td 
                          className="px-3 py-3 cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rab.project_type === 'interior' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {rab.project_type === 'interior' ? 'Interior' : 'Arsitektur'}
                          </span>
                        </td>
                        <td 
                          className="px-3 py-3 text-xs sm:text-sm text-slate-600 cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          {rab.client_name || '-'}
                        </td>
                        <td 
                          className="px-3 py-3 text-xs sm:text-sm text-slate-600 cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          {rab.location || '-'}
                        </td>
                        <td 
                          className="px-3 py-3 text-right font-semibold text-green-600 cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          {formatCurrency(rab.total_price || 0)}
                        </td>
                        <td 
                          className="px-3 py-3 text-center cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          {getStatusBadge(rab.status)}
                        </td>
                        <td 
                          className="px-3 py-3 text-center text-xs sm:text-sm text-slate-600 cursor-pointer"
                          onClick={() => navigate(`/planning/rab/${rab.id}`)}
                        >
                          {formatDate(rab.created_at)}
                        </td>
                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/planning/rab/${rab.id}`)}>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Update Status Dialog */}
      <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status ({selectedRabs.length} RAB)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status Baru</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="bidding_process">Bidding Process</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialog(false)}>Batal</Button>
            <Button onClick={handleBulkUpdateStatus}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus RAB <strong>{selectedRab?.project_name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteSingle}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RABList;

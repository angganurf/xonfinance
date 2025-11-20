import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  Search,
  Mail,
  User as UserIcon,
  Shield
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'employee'
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, filterRole, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Gagal memuat data member');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.username && member.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole);
    }

    setFilteredMembers(filtered);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/members', formData);
      toast.success('Member berhasil ditambahkan');
      setIsAddDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan member');
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await api.patch(`/admin/members/${selectedMember.id}`, updateData);
      toast.success('Member berhasil diupdate');
      setIsEditDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate member');
    }
  };

  const handleDeleteMember = async () => {
    try {
      await api.delete(`/admin/members/${selectedMember.id}`);
      toast.success('Member berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus member');
    }
  };

  const openEditDialog = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      username: member.username || '',
      password: '',
      role: member.role
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (member) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'employee'
    });
    setSelectedMember(null);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      accounting: 'bg-blue-100 text-blue-700',
      estimator: 'bg-green-100 text-green-700',
      site_supervisor: 'bg-orange-100 text-orange-700',
      employee: 'bg-purple-100 text-purple-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      accounting: 'Accounting',
      estimator: 'Estimator',
      site_supervisor: 'Site Supervisor',
      employee: 'Employee'
    };
    return labels[role] || role;
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Member Management</h1>
            <p className="text-slate-600">Kelola semua pengguna sistem</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Tambah Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Member Baru</DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk menambahkan member baru
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <Label htmlFor="add-name">Nama Lengkap</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="add-username">Username</Label>
                  <Input
                    id="add-username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="add-password">Password</Label>
                  <Input
                    id="add-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="add-role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accounting">Accounting</SelectItem>
                      <SelectItem value="estimator">Estimator</SelectItem>
                      <SelectItem value="site_supervisor">Site Supervisor</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => {setIsAddDialogOpen(false); resetForm();}}>
                    Batal
                  </Button>
                  <Button type="submit">Tambah</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari nama, email, atau username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="accounting">Accounting</SelectItem>
                  <SelectItem value="estimator">Estimator</SelectItem>
                  <SelectItem value="site_supervisor">Site Supervisor</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Member ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Tidak ada member ditemukan
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-slate-100 p-3 rounded-full">
                        <UserIcon className="h-6 w-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{member.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {member.email}
                          </div>
                          {member.username && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="h-4 w-4" />
                              @{member.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => openDeleteDialog(member)}
                        disabled={member.role === 'admin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                Update informasi member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMember} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-password">Password Baru (kosongkan jika tidak diubah)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Kosongkan jika tidak diubah"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accounting">Accounting</SelectItem>
                    <SelectItem value="estimator">Estimator</SelectItem>
                    <SelectItem value="site_supervisor">Site Supervisor</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
                  Batal
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Member</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus member <strong>{selectedMember?.name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedMember(null)}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMember} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Members;

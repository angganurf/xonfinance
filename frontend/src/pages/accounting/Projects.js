import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Building2 } from 'lucide-react';
import api from '../../utils/api';

const AccountingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'interior',
    description: '',
    contract_date: '',
    duration: '',
    location: '',
    project_value: ''
  });
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Gagal memuat proyek');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      toast.success('Proyek berhasil dibuat');
      setOpen(false);
      setFormData({ name: '', type: 'interior', description: '', contract_date: '', duration: '', location: '' });
      loadProjects();
    } catch (error) {
      toast.error('Gagal membuat proyek');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="projects-page">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Daftar Proyek</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-project-btn">
                <Plus className="mr-2 h-4 w-4" /> Tambah Proyek
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-project-dialog">
              <DialogHeader>
                <DialogTitle>Tambah Proyek Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nama Proyek</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required data-testid="project-name-input" />
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
                  <Label>Deskripsi</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} data-testid="project-description-input" />
                </div>
                <div>
                  <Label>Tanggal Kontrak</Label>
                  <Input type="date" value={formData.contract_date} onChange={(e) => setFormData({...formData, contract_date: e.target.value})} data-testid="project-contract-date-input" />
                </div>
                <div>
                  <Label>Durasi (hari)</Label>
                  <Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} data-testid="project-duration-input" />
                </div>
                <div>
                  <Label>Lokasi</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} data-testid="project-location-input" />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-project-btn">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`project-card-${project.id}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-slate-500">{project.type}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Lokasi:</span> {project.location || '-'}</p>
                  <p><span className="font-medium">Durasi:</span> {project.duration || '-'} hari</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{project.status}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AccountingProjects;
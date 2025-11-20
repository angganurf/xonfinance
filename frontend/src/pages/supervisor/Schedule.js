import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import api from '../../utils/api';

const SupervisorSchedule = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [scheduleItems, setScheduleItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    duration_days: '',
    start_week: '1'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) loadSchedule();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
      if (response.data.length > 0) setSelectedProject(response.data[0].id);
    } catch (error) {
      toast.error('Gagal memuat proyek');
    }
  };

  const loadSchedule = async () => {
    try {
      const response = await api.get(`/schedule/${selectedProject}`);
      setScheduleItems(response.data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        project_id: selectedProject,
        description: formData.description,
        value: parseFloat(formData.value),
        duration_days: parseInt(formData.duration_days),
        start_week: parseInt(formData.start_week)
      };
      await api.post('/schedule', data);
      toast.success('Item schedule berhasil ditambahkan');
      setOpen(false);
      setFormData({ description: '', value: '', duration_days: '', start_week: '1' });
      loadSchedule();
    } catch (error) {
      toast.error('Gagal menambahkan item');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="schedule-page">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Time Schedule</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-schedule-btn"><Plus className="mr-2 h-4 w-4" /> Tambah Item</Button>
            </DialogTrigger>
            <DialogContent data-testid="add-schedule-dialog">
              <DialogHeader>
                <DialogTitle>Tambah Item Schedule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Deskripsi Pekerjaan</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required data-testid="schedule-description-input" />
                </div>
                <div>
                  <Label>Nilai Pekerjaan (Rp)</Label>
                  <Input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} required data-testid="schedule-value-input" />
                </div>
                <div>
                  <Label>Durasi (hari)</Label>
                  <Input type="number" value={formData.duration_days} onChange={(e) => setFormData({...formData, duration_days: e.target.value})} required data-testid="schedule-duration-input" />
                </div>
                <div>
                  <Label>Mulai Minggu Ke-</Label>
                  <Input type="number" value={formData.start_week} onChange={(e) => setFormData({...formData, start_week: e.target.value})} required data-testid="schedule-week-input" />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-schedule-btn">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <Label>Pilih Proyek</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full md:w-96" data-testid="select-project">
              <SelectValue placeholder="Pilih proyek" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Jadwal Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="schedule-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Deskripsi</th>
                    <th className="text-right p-3">Nilai</th>
                    <th className="text-center p-3">Durasi (hari)</th>
                    <th className="text-center p-3">Mulai Minggu</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50" data-testid={`schedule-row-${item.id}`}>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">Rp {item.value?.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">{item.duration_days}</td>
                      <td className="p-3 text-center">Minggu {item.start_week}</td>
                    </tr>
                  ))}
                  {scheduleItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500">Belum ada item schedule</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SupervisorSchedule;
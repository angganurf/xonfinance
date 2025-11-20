import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Download, Trash2 } from 'lucide-react';
import api from '../../utils/api';

const EstimatorRAB = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [rabItems, setRabItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [formData, setFormData] = useState({
    category: 'persiapan',
    customCategory: '',
    description: '',
    unit_price: '',
    quantity: '',
    unit: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) loadRAB();
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

  const loadRAB = async () => {
    try {
      const response = await api.get(`/rab/${selectedProject}`);
      setRabItems(response.data);
    } catch (error) {
      console.error('Error loading RAB:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        project_id: selectedProject,
        category: formData.category,
        description: formData.description,
        unit_price: parseFloat(formData.unit_price),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit
      };
      await api.post('/rab', data);
      toast.success('Item RAB berhasil ditambahkan');
      setOpen(false);
      setFormData({ category: 'persiapan', description: '', unit_price: '', quantity: '', unit: '' });
      loadRAB();
    } catch (error) {
      toast.error('Gagal menambahkan item RAB');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`/rab/${itemId}`);
      toast.success('Item berhasil dihapus');
      loadRAB();
    } catch (error) {
      toast.error('Gagal menghapus item');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/rab/${selectedProject}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RAB_${selectedProject}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF berhasil didownload');
    } catch (error) {
      toast.error('Gagal export PDF');
    }
  };

  const calculateTotal = () => {
    return rabItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="rab-page">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Rencana Anggaran Biaya (RAB)</h2>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-rab-btn"><Plus className="mr-2 h-4 w-4" /> Tambah Item</Button>
              </DialogTrigger>
              <DialogContent data-testid="add-rab-dialog">
                <DialogHeader>
                  <DialogTitle>Tambah Item RAB</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Kategori</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger data-testid="rab-category-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="persiapan">Persiapan</SelectItem>
                        <SelectItem value="struktur">Struktur</SelectItem>
                        <SelectItem value="dinding">Dinding</SelectItem>
                        <SelectItem value="finishing">Finishing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Deskripsi Pekerjaan</Label>
                    <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required data-testid="rab-description-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Harga Satuan</Label>
                      <Input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} required data-testid="rab-price-input" />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required data-testid="rab-quantity-input" />
                    </div>
                  </div>
                  <div>
                    <Label>Satuan</Label>
                    <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} required data-testid="rab-unit-input" />
                  </div>
                  <Button type="submit" className="w-full" data-testid="submit-rab-btn">Simpan</Button>
                </form>
              </DialogContent>
            </Dialog>
            {rabItems.length > 0 && (
              <Button onClick={handleExport} variant="outline" data-testid="export-rab-btn">
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            )}
          </div>
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
            <CardTitle>Item RAB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="rab-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Kategori</th>
                    <th className="text-left p-3">Deskripsi</th>
                    <th className="text-right p-3">Harga Satuan</th>
                    <th className="text-right p-3">Quantity</th>
                    <th className="text-center p-3">Satuan</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-center p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rabItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50" data-testid={`rab-row-${item.id}`}>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.category}</span>
                      </td>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">Rp {item.unit_price?.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-center">{item.unit}</td>
                      <td className="p-3 text-right font-medium">Rp {item.total?.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} data-testid={`delete-rab-${item.id}`}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan="5" className="p-3 text-right">TOTAL:</td>
                    <td className="p-3 text-right text-lg">Rp {calculateTotal().toLocaleString('id-ID')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EstimatorRAB;
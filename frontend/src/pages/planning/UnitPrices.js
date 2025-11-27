import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { DollarSign, Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../utils/api';

const UnitPrices = () => {
  const [unitPrices, setUnitPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    unit: 'LS',
    price: 0,
    category: 'persiapan'
  });

  const categories = [
    { value: 'persiapan', label: 'Pekerjaan Persiapan' },
    { value: 'struktur', label: 'Pekerjaan Struktur' },
    { value: 'dinding', label: 'Pekerjaan Dinding' },
    { value: 'atap', label: 'Pekerjaan Atap' },
    { value: 'finishing', label: 'Pekerjaan Finishing' },
    { value: 'mekanikal', label: 'Pekerjaan Mekanikal' },
    { value: 'elektrikal', label: 'Pekerjaan Elektrikal' },
    { value: 'plumbing', label: 'Pekerjaan Plumbing' },
    { value: 'landscape', label: 'Pekerjaan Landscape' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  const units = ['LS', 'M', 'M2', 'M3', 'UNIT', 'SET', 'TITIK', 'BUAH', 'KG'];

  useEffect(() => {
    loadUnitPrices();
  }, []);

  const loadUnitPrices = async () => {
    try {
      const res = await api.get('/unit-prices');
      setUnitPrices(res.data);
    } catch (error) {
      console.error('Error loading unit prices:', error);
      toast.error('Gagal memuat data harga satuan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && selectedPrice) {
        await api.patch(`/unit-prices/${selectedPrice.id}?description=${encodeURIComponent(formData.description)}&unit=${formData.unit}&price=${formData.price}&category=${formData.category}`);
        toast.success('Harga satuan berhasil diupdate');
      } else {
        await api.post(`/unit-prices?description=${encodeURIComponent(formData.description)}&unit=${formData.unit}&price=${formData.price}&category=${formData.category}`);
        toast.success('Harga satuan berhasil ditambahkan');
      }
      
      setDialog(false);
      setFormData({ description: '', unit: 'LS', price: 0, category: 'persiapan' });
      setEditMode(false);
      setSelectedPrice(null);
      loadUnitPrices();
    } catch (error) {
      console.error('Error saving unit price:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  const handleEdit = (price) => {
    setSelectedPrice(price);
    setFormData({
      description: price.description,
      unit: price.unit,
      price: price.price,
      category: price.category
    });
    setEditMode(true);
    setDialog(true);
  };

  const handleDelete = async (priceId) => {
    if (!window.confirm('Hapus harga satuan ini?')) return;

    try {
      await api.delete(`/unit-prices/${priceId}`);
      toast.success('Harga satuan berhasil dihapus');
      loadUnitPrices();
    } catch (error) {
      console.error('Error deleting unit price:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const filteredPrices = unitPrices.filter(price =>
    price.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPrices = categories.map(cat => ({
    category: cat,
    items: filteredPrices.filter(p => p.category === cat.value)
  })).filter(group => group.items.length > 0);

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Harga Satuan Pekerjaan</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Database harga satuan untuk pembuatan RAB</p>
          </div>
          <Button onClick={() => {
            setDialog(true);
            setEditMode(false);
            setSelectedPrice(null);
            setFormData({ description: '', unit: 'LS', price: 0, category: 'persiapan' });
          }} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Tambah Harga Satuan
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari item pekerjaan atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Grouped List */}
        {groupedPrices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <DollarSign className="mx-auto h-12 w-12 mb-2 text-slate-300" />
              <p>Belum ada harga satuan</p>
            </CardContent>
          </Card>
        ) : (
          groupedPrices.map((group) => (
            <Card key={group.category.value}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="text-sm sm:text-base text-blue-800 uppercase">
                  {group.category.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Deskripsi</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">Satuan</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-slate-700">Harga Satuan</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                          <td className="px-3 py-3 text-xs sm:text-sm">{item.description}</td>
                          <td className="px-3 py-3 text-center text-xs sm:text-sm font-medium">{item.unit}</td>
                          <td className="px-3 py-3 text-right text-xs sm:text-sm font-semibold text-blue-600">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Harga Satuan' : 'Tambah Harga Satuan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Kategori Pekerjaan</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Deskripsi Pekerjaan</Label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contoh: Pekerjaan Pengukuran Ulang"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Satuan</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Harga Satuan</Label>
                <Input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Batal</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editMode ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UnitPrices;

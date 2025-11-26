import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Eye, ArrowLeft, FileText } from 'lucide-react';
import api from '../../utils/api';

const RABEditor = () => {
  const { rabId } = useParams();
  const navigate = useNavigate();
  const [rab, setRab] = useState(null);
  const [rabItems, setRabItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    unit_price: '',
    quantity: '',
    unit: ''
  });

  useEffect(() => {
    if (rabId) {
      loadRAB();
      loadRABItems();
    }
  }, [rabId]);

  const loadRAB = async () => {
    try {
      const res = await api.get(`/rabs/${rabId}`);
      setRab(res.data);
    } catch (error) {
      console.error('Error loading RAB:', error);
      toast.error('Gagal memuat RAB');
    }
  };

  const loadRABItems = async () => {
    try {
      const res = await api.get(`/rab-items?rab_id=${rabId}`);
      setRabItems(res.data);
    } catch (error) {
      console.error('Error loading RAB items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        rab_id: rabId,
        category: formData.category,
        description: formData.description,
        unit_price: parseFloat(formData.unit_price),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit
      };
      
      await api.post('/rab-items', data);
      toast.success('Item berhasil ditambahkan');
      setOpen(false);
      setFormData({ category: '', description: '', unit_price: '', quantity: '', unit: '' });
      loadRABItems();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Gagal menambahkan item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Hapus item ini?')) return;
    
    try {
      await api.delete(`/rab-items/${itemId}`);
      toast.success('Item berhasil dihapus');
      loadRABItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Gagal menghapus item');
    }
  };

  const handleSave = () => {
    toast.success('RAB berhasil disimpan!');
    loadRABItems();
  };

  const calculateSubtotal = () => {
    return rabItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = rab?.discount || 0;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * ((rab?.tax || 11) / 100);
    return afterDiscount + tax;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const groupedItems = rabItems.reduce((acc, item) => {
    const category = item.category || 'Lainnya';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  if (!rab) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/estimator')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Rencana Anggaran Biaya (RAB)</h2>
              <p className="text-sm text-slate-600 mt-1">{rab.project_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewDialog(true)}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* RAB Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Tipe Proyek</p>
                <p className="font-semibold text-slate-800">
                  {rab.project_type === 'interior' ? 'Interior' : 'Arsitektur'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Klien</p>
                <p className="font-semibold text-slate-800">{rab.client_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Lokasi</p>
                <p className="font-semibold text-slate-800">{rab.location || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Status</p>
                <p className={`font-semibold px-2 py-1 rounded-full text-xs inline-block ${
                  rab.status === 'approved' ? 'bg-green-100 text-green-800' :
                  rab.status === 'bidding_process' ? 'bg-yellow-100 text-yellow-800' :
                  rab.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {rab.status === 'approved' ? 'Approved' :
                   rab.status === 'bidding_process' ? 'Bidding Process' :
                   rab.status === 'rejected' ? 'Rejected' : 'Draft'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Item RAB</CardTitle>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                <p>Belum ada item RAB</p>
                <p className="text-sm mt-1">Klik "Tambah Item" untuk mulai menambahkan</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-slate-800 mb-3 uppercase text-sm border-b pb-2">
                      {category}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="text-left text-xs text-slate-600">
                          <tr>
                            <th className="pb-2">Deskripsi</th>
                            <th className="pb-2 text-right">Harga Satuan</th>
                            <th className="pb-2 text-right">Qty</th>
                            <th className="pb-2 text-center">Satuan</th>
                            <th className="pb-2 text-right">Total</th>
                            <th className="pb-2 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-slate-50">
                              <td className="py-2">{item.description}</td>
                              <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                              <td className="py-2 text-right">{item.quantity}</td>
                              <td className="py-2 text-center">{item.unit}</td>
                              <td className="py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                              <td className="py-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {rabItems.length > 0 && (
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Diskon</span>
                  <span className="font-semibold">- {formatCurrency(rab.discount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Pajak ({rab.tax || 11}%)</span>
                  <span className="font-semibold">{formatCurrency((calculateSubtotal() - (rab.discount || 0)) * ((rab.tax || 11) / 100))}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-slate-800">TOTAL</span>
                  <span className="font-bold text-blue-600 text-xl">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item RAB</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Kategori</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Contoh: Persiapan, Pekerjaan Struktur"
                required
              />
            </div>

            <div>
              <Label>Deskripsi Pekerjaan</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Contoh: Galian Tanah Pondasi"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Harga Satuan (Rp)</Label>
                <Input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  placeholder="50000"
                  required
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Satuan</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="Contoh: m³, m², unit, ls"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Tambah Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview RAB</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold text-slate-800">RENCANA ANGGARAN BIAYA</h2>
              <p className="text-lg font-semibold mt-2">{rab.project_name}</p>
              <p className="text-sm text-slate-600 mt-1">
                {rab.client_name && `Klien: ${rab.client_name}`}
                {rab.location && ` • Lokasi: ${rab.location}`}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items], idx) => (
                <div key={category}>
                  <h3 className="font-bold text-slate-800 mb-2 bg-slate-100 px-3 py-2 uppercase text-sm">
                    {idx + 1}. {category}
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left text-xs text-slate-600">
                        <th className="pb-2 w-8">No</th>
                        <th className="pb-2">Uraian</th>
                        <th className="pb-2 text-right">Harga Satuan</th>
                        <th className="pb-2 text-right">Volume</th>
                        <th className="pb-2 text-center">Satuan</th>
                        <th className="pb-2 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, itemIdx) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2">{itemIdx + 1}</td>
                          <td className="py-2">{item.description}</td>
                          <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 text-right">{item.quantity}</td>
                          <td className="py-2 text-center">{item.unit}</td>
                          <td className="py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Diskon:</span>
                    <span className="font-semibold">- {formatCurrency(rab.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pajak ({rab.tax || 11}%):</span>
                    <span className="font-semibold">{formatCurrency((calculateSubtotal() - (rab.discount || 0)) * ((rab.tax || 11) / 100))}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>TOTAL:</span>
                    <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RABEditor;

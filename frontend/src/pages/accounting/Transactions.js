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
import { Plus, Upload } from 'lucide-react';
import api from '../../utils/api';

const AccountingTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    category: 'kas_masuk',
    description: '',
    amount: '',
    quantity: '',
    unit: '',
    receipt: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transRes, projRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/projects')
      ]);
      setTransactions(transRes.data);
      setProjects(projRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 6000000) {
        toast.error('Ukuran file maksimal 6MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({...formData, receipt: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {...formData, amount: parseFloat(formData.amount)};
      if (formData.quantity) data.quantity = parseFloat(formData.quantity);
      await api.post('/transactions', data);
      toast.success('Transaksi berhasil ditambahkan');
      setOpen(false);
      setFormData({
        project_id: '', category: 'bahan', description: '', amount: '', quantity: '', unit: '', receipt: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      toast.error('Gagal menambahkan transaksi');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="transactions-page">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Transaksi</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-transaction-btn"><Plus className="mr-2 h-4 w-4" /> Tambah Transaksi</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-transaction-dialog">
              <DialogHeader>
                <DialogTitle>Tambah Transaksi</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Proyek</Label>
                  <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})} required>
                    <SelectTrigger data-testid="transaction-project-select"><SelectValue placeholder="Pilih proyek" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger data-testid="transaction-category-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kas_masuk">Kas Masuk</SelectItem>
                      <SelectItem value="bahan">Bahan</SelectItem>
                      <SelectItem value="upah">Upah</SelectItem>
                      <SelectItem value="alat">Alat</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="operasional">Operasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required data-testid="transaction-description-input" />
                </div>
                {formData.category === 'bahan' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantity</Label>
                        <Input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} data-testid="transaction-quantity-input" />
                      </div>
                      <div>
                        <Label>Satuan</Label>
                        <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} data-testid="transaction-unit-input" />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <Label>Jumlah (Rp)</Label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required data-testid="transaction-amount-input" />
                </div>
                <div>
                  <Label>Tanggal Transaksi</Label>
                  <Input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} data-testid="transaction-date-input" />
                </div>
                <div>
                  <Label>Upload Struk/Nota (Max 6MB)</Label>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} data-testid="transaction-receipt-input" />
                  {formData.receipt && <p className="text-sm text-green-600 mt-2">File berhasil diupload</p>}
                </div>
                <Button type="submit" className="w-full" data-testid="submit-transaction-btn">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="transactions-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Waktu</th>
                    <th className="text-left p-3">Deskripsi</th>
                    <th className="text-left p-3">Kategori</th>
                    <th className="text-right p-3">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => {
                    const isIncome = trans.category === 'kas_masuk' || trans.category === 'uang_masuk';
                    const date = new Date(trans.transaction_date);
                    const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <tr key={trans.id} className="border-b hover:bg-slate-50" data-testid={`transaction-row-${trans.id}`}>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-medium">{formattedDate}</div>
                            <div className="text-slate-500 text-xs">{formattedTime}</div>
                          </div>
                        </td>
                        <td className="p-3">{trans.description}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isIncome ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {trans.category === 'kas_masuk' ? 'Kas Masuk' : 
                             trans.category === 'uang_masuk' ? 'Kas Masuk' :
                             trans.category.charAt(0).toUpperCase() + trans.category.slice(1)}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}Rp {trans.amount?.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccountingTransactions;
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoreVertical, Trash } from 'lucide-react';
import api from '../../utils/api';

const AccountingTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    category: 'kas_masuk',
    description: '',
    amount: '',
    quantity: '',
    unit: '',
    status: '',
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

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        project_id: transaction.project_id,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount.toString(),
        quantity: transaction.quantity?.toString() || '',
        unit: transaction.unit || '',
        status: transaction.status || '',
        receipt: transaction.receipt || '',
        transaction_date: transaction.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        project_id: '',
        category: 'kas_masuk',
        description: '',
        amount: '',
        quantity: '',
        unit: '',
        status: '',
        receipt: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }
    setOpen(true);
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
    
    if (!formData.project_id) {
      toast.error('Pilih proyek terlebih dahulu');
      return;
    }
    
    try {
      const data = {
        project_id: formData.project_id,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date
      };
      
      if (formData.quantity) data.quantity = parseFloat(formData.quantity);
      if (formData.unit) data.unit = formData.unit;
      if (formData.status) data.status = formData.status;
      if (formData.receipt) data.receipt = formData.receipt;
      
      if (editingTransaction) {
        await api.patch(`/transactions/${editingTransaction.id}`, data);
        toast.success('Transaksi berhasil diupdate');
      } else {
        await api.post('/transactions', data);
        toast.success('Transaksi berhasil ditambahkan');
      }
      
      setOpen(false);
      setEditingTransaction(null);
      loadData();
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan transaksi');
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await api.delete(`/transactions/${transactionToDelete.id}`);
      toast.success('Transaksi berhasil dihapus');
      setDeleteDialog(false);
      setTransactionToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Gagal menghapus transaksi');
    }
  };

  const handleClearAll = async () => {
    try {
      const deletePromises = transactions.map(trans => 
        api.delete(`/transactions/${trans.id}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${transactions.length} transaksi berhasil dihapus`);
      setClearAllDialog(false);
      loadData();
    } catch (error) {
      toast.error('Gagal menghapus transaksi');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      kas_masuk: 'Kas Masuk',
      uang_masuk: 'Kas Masuk',
      bahan: 'Bahan',
      upah: 'Upah',
      alat: 'Alat',
      vendor: 'Vendor',
      operasional: 'Operasional',
      aset: 'Aset',
      hutang: 'Hutang'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const isIncome = category === 'kas_masuk' || category === 'uang_masuk' || category === 'hutang';
    return isIncome ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="transactions-page">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Transaksi</h2>
          <div className="flex gap-2">
            {transactions.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setClearAllDialog(true)}
                data-testid="clear-all-btn"
              >
                <Trash className="mr-2 h-4 w-4" /> Clear Semua
              </Button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} data-testid="add-transaction-btn">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="transaction-dialog">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Proyek *</Label>
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
                        <SelectItem value="hutang">Hutang (Pinjaman/Tempo)</SelectItem>
                        <SelectItem value="aset">Aset (Kendaraan/Mesin)</SelectItem>
                        <SelectItem value="bahan">Bahan</SelectItem>
                        <SelectItem value="upah">Upah</SelectItem>
                        <SelectItem value="alat">Alat</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="operasional">Operasional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Deskripsi *</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required data-testid="transaction-description-input" />
                  </div>
                  {formData.category === 'bahan' && (
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
                  )}
                  {formData.category === 'aset' && (
                    <div>
                      <Label>Status Aset</Label>
                      <Input 
                        value={formData.status} 
                        onChange={(e) => setFormData({...formData, status: e.target.value})} 
                        placeholder="Contoh: Aktif, Maintenance, Rusak, dll"
                        data-testid="transaction-status-input"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Jumlah (Rp) *</Label>
                    <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required data-testid="transaction-amount-input" />
                  </div>
                  <div>
                    <Label>Tanggal Transaksi</Label>
                    <Input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} data-testid="transaction-date-input" />
                  </div>
                  <div>
                    <Label>Upload Struk/Nota (Max 6MB)</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} data-testid="transaction-receipt-input" />
                    {formData.receipt && <p className="text-sm text-green-600 mt-2">✓ File berhasil diupload</p>}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                    <Button type="submit" data-testid="submit-transaction-btn">{editingTransaction ? 'Update' : 'Simpan'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
                    <th className="text-center p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => {
                    const isIncome = trans.category === 'kas_masuk' || trans.category === 'uang_masuk' || trans.category === 'hutang';
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
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{trans.description}</p>
                            {trans.status && <p className="text-xs text-slate-500">Status: {trans.status}</p>}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(trans.category)}`}>
                            {getCategoryLabel(trans.category)}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-bold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncome ? '+' : '-'}Rp {trans.amount?.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`transaction-menu-${trans.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(trans)} data-testid={`edit-transaction-${trans.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setTransactionToDelete(trans);
                                  setDeleteDialog(true);
                                }}
                                className="text-red-600"
                                data-testid={`delete-transaction-${trans.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <p>Belum ada transaksi</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent data-testid="delete-transaction-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi "{transactionToDelete?.description}" sebesar Rp {transactionToDelete?.amount?.toLocaleString('id-ID')}? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearAllDialog} onOpenChange={setClearAllDialog}>
        <AlertDialogContent data-testid="clear-all-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Semua Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA {transactions.length} transaksi? 
              Tindakan ini akan menghapus seluruh riwayat transaksi dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-clear-all-btn">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAll} 
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-clear-all-btn"
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AccountingTransactions;
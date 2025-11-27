import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
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
import { Plus, Edit, Trash2, MoreVertical, Trash, X, ArrowUpDown } from 'lucide-react';
import api from '../../utils/api';

const AccountingTransactions = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAccountingRoute = location.pathname.startsWith('/accounting');
  
  // Check if user is in accounting context (not admin viewing accounting transactions)
  const hideKasMasuk = isAccountingRoute;
  const [transactions, setTransactions] = useState([]);
  const [sortedTransactions, setSortedTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [itemNames, setItemNames] = useState([]);
  const [supplierNames, setSupplierNames] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'desc' });
  
  const [formData, setFormData] = useState({
    project_id: '',
    category: hideKasMasuk ? 'bahan' : 'kas_masuk',
    description: '',
    amount: '',
    quantity: '',
    unit: '',
    status: '',
    receipt: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_time: new Date().toTimeString().slice(0, 5) // HH:MM format
  });
  
  const [bahanItems, setBahanItems] = useState([
    { description: '', unit_price: '', quantity: '', unit: '', total: 0, status: 'receiving', supplier: '' }
  ]);
  
  const [supplierName, setSupplierName] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showSuggestions, setShowSuggestions] = useState({});
  const [filteredSuggestions, setFilteredSuggestions] = useState({});

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    sortTransactions();
  }, [transactions, sortConfig]);
  
  useEffect(() => {
    // Load item names when category is bahan or alat and project is selected
    if ((formData.category === 'bahan' || formData.category === 'alat') && formData.project_id) {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      if (selectedProject) {
        loadItemNames(formData.category, selectedProject.type);
      }
      loadSuppliers(); // Also load suppliers
    }
  }, [formData.category, formData.project_id, projects]);

  const loadData = async () => {
    try {
      const [transRes, projRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/projects')
      ]);
      
      // Filter out kas_masuk for accounting route
      let filteredTransactions = transRes.data;
      if (hideKasMasuk) {
        filteredTransactions = transRes.data.filter(t => 
          t.category !== 'kas_masuk' && t.category !== 'uang_masuk'
        );
      }
      
      setTransactions(filteredTransactions);
      setProjects(projRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    }
  };
  
  const loadItemNames = async (category, projectType = null) => {
    try {
      let url = `/inventory/item-names?category=${category}`;
      if (projectType) {
        url += `&project_type=${projectType}`;
      }
      const res = await api.get(url);
      setItemNames(res.data.item_names || []);
    } catch (error) {
      console.error('Error loading item names:', error);
      setItemNames([]);
    }
  };
  
  const loadSuppliers = async () => {
    try {
      const res = await api.get('/inventory/suppliers');
      setSupplierNames(res.data.suppliers || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSupplierNames([]);
    }
  };
  
  const sortTransactions = () => {
    const sorted = [...transactions].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'transaction_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortConfig.key === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setSortedTransactions(sorted);
  };
  
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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
      if (transaction.items && transaction.items.length > 0) {
        setBahanItems(transaction.items.map(item => ({
          ...item,
          status: item.status || 'receiving',
          supplier: item.supplier || ''
        })));
        // Set supplier name from first item if available
        setSupplierName(transaction.items[0]?.supplier || '');
      } else {
        setBahanItems([{ description: '', unit_price: '', quantity: '', unit: '', total: 0, status: 'receiving', supplier: '' }]);
        setSupplierName('');
      }
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
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_time: new Date().toTimeString().slice(0, 5)
      });
      setBahanItems([{ description: '', unit_price: '', quantity: '', unit: '', total: 0, status: 'receiving', supplier: '' }]);
      setSupplierName('');
    }
    setOpen(true);
  };
  
  const handleBahanItemChange = (index, field, value) => {
    const updatedItems = [...bahanItems];
    updatedItems[index][field] = value;
    
    if (field === 'unit_price' || field === 'quantity') {
      const unitPrice = parseFloat(updatedItems[index].unit_price) || 0;
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      updatedItems[index].total = unitPrice * quantity;
    }
    
    // Handle autocomplete for description
    if (field === 'description') {
      if (value.trim().length > 0) {
        const filtered = itemNames.filter(name =>
          name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions({ ...filteredSuggestions, [index]: filtered });
        setShowSuggestions({ ...showSuggestions, [index]: filtered.length > 0 });
      } else {
        setShowSuggestions({ ...showSuggestions, [index]: false });
      }
    }
    
    setBahanItems(updatedItems);
  };
  
  const selectSuggestion = (index, suggestion) => {
    const updatedItems = [...bahanItems];
    updatedItems[index].description = suggestion;
    setBahanItems(updatedItems);
    setShowSuggestions({ ...showSuggestions, [index]: false });
  };
  
  const addBahanItem = () => {
    setBahanItems([...bahanItems, { description: '', unit_price: '', quantity: '', unit: '', total: 0, status: 'receiving', supplier: supplierName }]);
  };
  
  const removeBahanItem = (index) => {
    if (bahanItems.length > 1) {
      setBahanItems(bahanItems.filter((_, i) => i !== index));
    }
  };
  
  const calculateTotalBahan = () => {
    return bahanItems.reduce((sum, item) => sum + (item.total || 0), 0);
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
      // Combine date and time into ISO format
      const transactionDateTime = `${formData.transaction_date}T${formData.transaction_time || '00:00'}:00`;
      
      const data = {
        project_id: formData.project_id,
        category: formData.category,
        transaction_date: transactionDateTime
      };
      
      if (formData.category === 'bahan') {
        const validItems = bahanItems.filter(item => item.description && item.unit_price && item.quantity);
        if (validItems.length === 0) {
          toast.error('Tambahkan minimal 1 item bahan');
          return;
        }
        data.description = `Pembelian Bahan (${validItems.length} item)${supplierName ? ' dari ' + supplierName : ''}`;
        data.amount = calculateTotalBahan();
        data.items = validItems.map(item => ({
          description: item.description,
          unit_price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          total: item.total,
          status: item.status || 'receiving',
          supplier: supplierName || null
        }));
      } else {
        data.description = formData.description;
        data.amount = parseFloat(formData.amount);
        if (formData.quantity) data.quantity = parseFloat(formData.quantity);
        if (formData.unit) data.unit = formData.unit;
        if (formData.status) data.status = formData.status;
      }
      
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
  
  const handleUpdateItemStatus = async (transactionId, itemIndex, newStatus) => {
    try {
      await api.put(`/transactions/${transactionId}/item-status?item_index=${itemIndex}&new_status=${newStatus}`);
      toast.success('Status item berhasil diupdate dan inventory sudah disinkronkan');
      loadData(); // Reload to show updated data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update status item');
    }
  };
  
  const toggleRow = (transId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transId)) {
        newSet.delete(transId);
      } else {
        newSet.add(transId);
      }
      return newSet;
    });
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
  
  const SortButton = ({ column, label }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

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
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="transaction-dialog">
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
                        {!hideKasMasuk && <SelectItem value="kas_masuk">Kas Masuk</SelectItem>}
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
                  
                  {formData.category === 'bahan' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-semibold">Daftar Bahan</Label>
                        <Button type="button" size="sm" onClick={addBahanItem} data-testid="add-bahan-item">
                          <Plus className="h-4 w-4 mr-1" /> Tambah Bahan
                        </Button>
                      </div>
                      {bahanItems.map((item, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-3">
                              <div>
                                <Label className="text-xs">Deskripsi Bahan</Label>
                                <Input
                                  list={`item-names-${index}`}
                                  value={item.description}
                                  onChange={(e) => handleBahanItemChange(index, 'description', e.target.value)}
                                  placeholder="Ketik atau pilih nama bahan yang sudah ada"
                                  data-testid={`bahan-desc-${index}`}
                                />
                                <datalist id={`item-names-${index}`}>
                                  {itemNames.map((name, i) => (
                                    <option key={i} value={name} />
                                  ))}
                                </datalist>
                                {item.description && itemNames.includes(item.description) && (
                                  <p className="text-xs text-green-600 mt-1">✓ Item sudah ada di inventory</p>
                                )}
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                <div>
                                  <Label className="text-xs">Harga Satuan</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => handleBahanItemChange(index, 'unit_price', e.target.value)}
                                    placeholder="0"
                                    data-testid={`bahan-price-${index}`}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(e) => handleBahanItemChange(index, 'quantity', e.target.value)}
                                    placeholder="0"
                                    data-testid={`bahan-qty-${index}`}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Satuan</Label>
                                  <Input
                                    value={item.unit}
                                    onChange={(e) => handleBahanItemChange(index, 'unit', e.target.value)}
                                    placeholder="pcs/kg/m"
                                    data-testid={`bahan-unit-${index}`}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Jumlah</Label>
                                  <Input
                                    value={`Rp ${item.total.toLocaleString('id-ID')}`}
                                    disabled
                                    className="bg-slate-100 font-bold"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Status *</Label>
                                  <Select 
                                    value={item.status || 'receiving'} 
                                    onValueChange={(v) => handleBahanItemChange(index, 'status', v)}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="receiving">Di Gudang</SelectItem>
                                      <SelectItem value="out_warehouse">Belum Sampai</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            {bahanItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBahanItem(index)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`remove-bahan-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-blue-900">Total Keseluruhan:</span>
                          <span className="text-xl font-bold text-blue-900">Rp {calculateTotalBahan().toLocaleString('id-ID')}</span>
                        </div>
                        <div className="border-t border-blue-300 pt-3 mt-3">
                          <Label className="text-sm font-medium text-blue-900">Nama Toko/Supplier (Opsional)</Label>
                          <Input
                            list="supplier-names"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            placeholder="Ketik atau pilih nama toko yang sudah ada"
                            className="mt-2 bg-white"
                          />
                          <datalist id="supplier-names">
                            {supplierNames.map((name, i) => (
                              <option key={i} value={name} />
                            ))}
                          </datalist>
                          <p className="text-xs text-blue-700 mt-1">
                            * Akan membantu tracking & perbandingan harga per toko
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>Deskripsi *</Label>
                        <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required data-testid="transaction-description-input" />
                      </div>
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
                    </>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tanggal Transaksi</Label>
                      <Input 
                        type="date" 
                        value={formData.transaction_date} 
                        onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} 
                        data-testid="transaction-date-input" 
                      />
                    </div>
                    <div>
                      <Label>Waktu</Label>
                      <Input 
                        type="time" 
                        value={formData.transaction_time} 
                        onChange={(e) => setFormData({...formData, transaction_time: e.target.value})} 
                        data-testid="transaction-time-input"
                      />
                      <p className="text-xs text-slate-500 mt-1">Waktu WIB</p>
                    </div>
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
                    <th className="text-left p-3">
                      <SortButton column="transaction_date" label="Waktu" />
                    </th>
                    <th className="text-left p-3">
                      <SortButton column="description" label="Deskripsi" />
                    </th>
                    <th className="text-left p-3">
                      <SortButton column="category" label="Kategori" />
                    </th>
                    <th className="text-right p-3">
                      <SortButton column="amount" label="Jumlah" />
                    </th>
                    <th className="text-center p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((trans) => {
                    const isIncome = trans.category === 'kas_masuk' || trans.category === 'uang_masuk' || trans.category === 'hutang';
                    const date = new Date(trans.transaction_date);
                    const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const hasItems = trans.items && trans.items.length > 0;
                    const isExpanded = expandedRows.has(trans.id);
                    
                    return (
                      <React.Fragment key={trans.id}>
                      <tr className="border-b hover:bg-slate-50" data-testid={`transaction-row-${trans.id}`}>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-medium">{formattedDate}</div>
                            <div className="text-slate-500 text-xs">{formattedTime}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {hasItems && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleRow(trans.id)}
                                className="p-1 h-6 w-6"
                              >
                                {isExpanded ? '▼' : '▶'}
                              </Button>
                            )}
                            <div>
                              <p className="font-medium">{trans.description}</p>
                              {trans.status && <p className="text-xs text-slate-500">Status: {trans.status}</p>}
                              {hasItems && (
                                <p className="text-xs text-blue-600">{trans.items.length} item bahan</p>
                              )}
                            </div>
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
                      
                      {/* Expanded Row - Detail Items */}
                      {isExpanded && hasItems && (
                        <tr className="bg-slate-50">
                          <td colSpan="5" className="p-4">
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-semibold mb-3 text-slate-700">Detail Item Bahan:</h4>
                              <div className="space-y-2">
                                {trans.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between border-b pb-2">
                                    <div className="flex-1">
                                      <p className="font-medium">{item.description}</p>
                                      <p className="text-xs text-slate-600">
                                        {item.quantity} {item.unit} × Rp {item.unit_price?.toLocaleString('id-ID')} = Rp {item.total?.toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Select 
                                        value={item.status || 'receiving'} 
                                        onValueChange={(newStatus) => handleUpdateItemStatus(trans.id, idx, newStatus)}
                                      >
                                        <SelectTrigger className="w-40">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="receiving">
                                            <span className="flex items-center gap-2">
                                              ✅ Di Gudang
                                            </span>
                                          </SelectItem>
                                          <SelectItem value="out_warehouse">
                                            <span className="flex items-center gap-2">
                                              📦 Belum Sampai
                                            </span>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        item.status === 'receiving' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {item.status === 'receiving' ? 'Di Gudang' : 'Belum Sampai'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {sortedTransactions.length === 0 && (
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
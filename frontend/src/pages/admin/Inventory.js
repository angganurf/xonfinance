import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoreVertical, Package, Search, Eye, Store } from 'lucide-react';
import api from '../../utils/api';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('interior'); // interior or arsitektur
  const [subTab, setSubTab] = useState('stok'); // stok or daftar_bahan
  const [projects, setProjects] = useState([]);
  const [priceComparison, setPriceComparison] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [breakdownDialog, setBreakdownDialog] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [priceComparisonDialog, setPriceComparisonDialog] = useState(false);
  const [selectedItemPriceComparison, setSelectedItemPriceComparison] = useState(null);
  
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'bahan',
    quantity: '',
    unit: '',
    unit_price: '',
    status: 'Tersedia'
  });

  useEffect(() => {
    if (subTab === 'daftar_bahan') {
      loadPriceComparison();
    } else {
      loadInventory();
      loadProjects();
    }
  }, [categoryFilter, activeTab, subTab]);
  
  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, categoryFilter, activeTab]);

  const loadInventory = async () => {
    try {
      const res = await api.get(`/inventory?category=${categoryFilter}`);
      setInventory(res.data);
    } catch (error) {
      toast.error('Gagal memuat data inventory');
    }
  };
  
  const loadProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };
  
  const loadPriceComparison = async () => {
    try {
      const res = await api.get(`/inventory/price-comparison?project_type=${activeTab}`);
      setPriceComparison(res.data);
    } catch (error) {
      toast.error('Gagal memuat data perbandingan harga');
      console.error('Error loading price comparison:', error);
    }
  };
  
  const filterInventory = () => {
    let filtered = [...inventory];
    
    // Filter by tab (interior or arsitektur)
    filtered = filtered.filter(item => item.project_type === activeTab);
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredInventory(filtered);
  };
  
  // Group inventory by project for arsitektur tab
  const getInventoryByProject = () => {
    const grouped = {};
    filteredInventory.forEach(item => {
      if (!grouped[item.project_id]) {
        grouped[item.project_id] = {
          project_id: item.project_id,
          project_name: item.project_name,
          items: []
        };
      }
      grouped[item.project_id].items.push(item);
    });
    return Object.values(grouped);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unit_price: item.unit_price.toString(),
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({
        item_name: '',
        category: 'bahan',
        quantity: '',
        unit: '',
        unit_price: '',
        status: 'Tersedia'
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        item_name: formData.item_name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        unit_price: parseFloat(formData.unit_price),
        status: formData.status
      };

      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, data);
        toast.success('Item inventory berhasil diupdate');
      } else {
        toast.info('Gunakan transaksi untuk menambah item inventory');
      }
      
      setOpen(false);
      setEditingItem(null);
      loadInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await api.delete(`/inventory/${itemToDelete.id}`);
      toast.success('Item inventory berhasil dihapus');
      setDeleteDialog(false);
      setItemToDelete(null);
      loadInventory();
    } catch (error) {
      toast.error('Gagal menghapus item');
    }
  };
  
  const handleViewBreakdown = async (item) => {
    try {
      const res = await api.get(`/inventory/${item.id}/breakdown-by-supplier`);
      setBreakdownData(res.data);
      setBreakdownDialog(true);
    } catch (error) {
      toast.error('Gagal memuat breakdown per toko');
    }
  };

  const getCategoryLabel = (category) => {
    return category === 'bahan' ? 'Bahan' : 'Alat';
  };

  const getCategoryColor = (category) => {
    return category === 'bahan' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };
  
  const getStatusColor = (status) => {
    const colors = {
      // Status Bahan
      'Tersedia': 'bg-green-100 text-green-800',
      'Order': 'bg-orange-100 text-orange-800',
      'Habis': 'bg-red-100 text-red-800',
      // Status Alat
      'Bagus': 'bg-green-100 text-green-800',
      'Rusak': 'bg-red-100 text-red-800',
      'Perlu di Retur': 'bg-yellow-100 text-yellow-800',
      'Dipinjam': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Inventory</h2>
            <p className="text-sm text-slate-600 mt-1">Kelola stok bahan dan alat proyek</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Manual
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('interior')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'interior'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📐 Inventory Interior
          </button>
          <button
            onClick={() => setActiveTab('arsitektur')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'arsitektur'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏗️ Inventory Arsitektur
          </button>
          <button
            onClick={() => setActiveTab('daftar_bahan')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'daftar_bahan'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Daftar Bahan
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama item atau proyek..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="bahan">Bahan</SelectItem>
                    <SelectItem value="alat">Alat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'daftar_bahan' ? (
              /* Daftar Bahan Tab - Price Comparison */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Perbandingan Harga Bahan</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Tabel ini menampilkan perbandingan harga bahan dari berbagai supplier berdasarkan data transaksi.
                  </p>
                </div>
                
                {priceComparison.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Package className="mx-auto h-16 w-16 mb-4 text-slate-300" />
                    <p className="text-lg font-medium">Belum ada data perbandingan harga</p>
                    <p className="text-sm mt-2">Tambahkan transaksi bahan dengan mengisi "Nama Toko" untuk melihat perbandingan harga</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-slate-50">
                        <tr className="text-left text-sm text-slate-600">
                          <th className="py-3 px-4 font-semibold">Nama Bahan</th>
                          <th className="py-3 px-4 font-semibold">Satuan</th>
                          <th className="py-3 px-4 font-semibold text-center">Jumlah Supplier</th>
                          <th className="py-3 px-4 font-semibold text-right">Harga Terendah</th>
                          <th className="py-3 px-4 font-semibold text-right">Harga Tertinggi</th>
                          <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceComparison.map((item, index) => {
                          const lowestPrice = item.suppliers.length > 0 ? item.suppliers[0].latest_price : 0;
                          const highestPrice = item.suppliers.length > 0 ? item.suppliers[item.suppliers.length - 1].latest_price : 0;
                          
                          return (
                            <tr key={index} className="border-b hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium">{item.item_name}</td>
                              <td className="py-3 px-4">{item.unit}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {item.suppliers.length} supplier
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-green-600 font-semibold">
                                {formatCurrency(lowestPrice)}
                              </td>
                              <td className="py-3 px-4 text-right text-red-600 font-semibold">
                                {formatCurrency(highestPrice)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItemPriceComparison(item);
                                    setPriceComparisonDialog(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> Detail
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'interior' ? (
              /* Interior Tab - Single Table */
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-slate-600">
                    <th className="pb-3 font-semibold">Nama Item</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold text-right">Di Gudang</th>
                    <th className="pb-3 font-semibold text-right">Belum Sampai</th>
                    <th className="pb-3 font-semibold text-right">Total Stok</th>
                    <th className="pb-3 font-semibold">Satuan</th>
                    <th className="pb-3 font-semibold text-right">Harga/Unit</th>
                    <th className="pb-3 font-semibold text-right">Nilai Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Proyek</th>
                    <th className="pb-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="py-8 text-center text-slate-500">
                        <Package className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                        <p>Belum ada data inventory</p>
                        <p className="text-sm mt-1">Tambahkan transaksi bahan/alat untuk menambah inventory</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 font-medium">{item.item_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-green-600">
                          {item.quantity_in_warehouse || 0}
                        </td>
                        <td className="py-3 text-right font-semibold text-orange-600">
                          {item.quantity_out_warehouse || 0}
                        </td>
                        <td className="py-3 text-right font-bold text-blue-600">
                          {(item.quantity_in_warehouse || 0) + (item.quantity_out_warehouse || 0)}
                        </td>
                        <td className="py-3">{item.unit}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3 text-right font-semibold">{formatCurrency(item.total_value)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-slate-600">{item.project_name}</td>
                        <td className="py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewBreakdown(item)}>
                                <Store className="mr-2 h-4 w-4" /> Lihat Per Toko
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setItemToDelete(item);
                                  setDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            ) : (
              /* Arsitektur Tab - Grouped by Project */
              <div className="space-y-6">
                {getInventoryByProject().length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Package className="mx-auto h-16 w-16 mb-4 text-slate-300" />
                    <p className="text-lg font-medium">Belum ada inventory arsitektur</p>
                    <p className="text-sm mt-2">Tambahkan transaksi bahan/alat pada proyek arsitektur</p>
                  </div>
                ) : (
                  getInventoryByProject().map((projectGroup) => (
                    <Card key={projectGroup.project_id} className="border-2">
                      <CardHeader className="bg-slate-50">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🏗️ {projectGroup.project_name}
                          <span className="text-sm font-normal text-slate-600">
                            ({projectGroup.items.length} item)
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b bg-slate-50">
                              <tr className="text-left text-xs text-slate-600">
                                <th className="py-2 px-3 font-semibold">Nama Item</th>
                                <th className="py-2 px-3 font-semibold">Kategori</th>
                                <th className="py-2 px-3 font-semibold text-right">Di Gudang</th>
                                <th className="py-2 px-3 font-semibold text-right">Belum Sampai</th>
                                <th className="py-2 px-3 font-semibold text-right">Total</th>
                                <th className="py-2 px-3 font-semibold">Unit</th>
                                <th className="py-2 px-3 font-semibold text-right">Harga/Unit</th>
                                <th className="py-2 px-3 font-semibold">Status</th>
                                <th className="py-2 px-3 font-semibold text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectGroup.items.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-slate-50">
                                  <td className="py-2 px-3 font-medium text-sm">{item.item_name}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                                      {getCategoryLabel(item.category)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-green-600 text-sm">
                                    {item.quantity_in_warehouse || 0}
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-orange-600 text-sm">
                                    {item.quantity_out_warehouse || 0}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-blue-600 text-sm">
                                    {(item.quantity_in_warehouse || 0) + (item.quantity_out_warehouse || 0)}
                                  </td>
                                  <td className="py-2 px-3 text-sm">{item.unit}</td>
                                  <td className="py-2 px-3 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleViewBreakdown(item)}>
                                          <Store className="mr-2 h-4 w-4" /> Lihat Per Toko
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                                          <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            setItemToDelete(item);
                                            setDeleteDialog(true);
                                          }}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
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
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item Inventory' : 'Tambah Item Inventory'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p>💡 <strong>Tip:</strong> Item inventory otomatis ditambahkan dari transaksi kategori Bahan atau Alat.</p>
                  <p className="mt-1">Gunakan form ini hanya untuk menambah manual jika diperlukan.</p>
                </div>
              )}
              
              <div>
                <Label>Nama Item *</Label>
                <Input
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                  placeholder="Contoh: Semen 50kg"
                  required
                  disabled={!!editingItem}
                />
              </div>

              <div>
                <Label>Kategori</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v})}
                  disabled={!!editingItem}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bahan">Bahan</SelectItem>
                    <SelectItem value="alat">Alat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jumlah Stok *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label>Satuan *</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="m³, kg, pcs"
                    required
                    disabled={!!editingItem}
                  />
                </div>
              </div>

              <div>
                <Label>Harga per Unit *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formData.category === 'bahan' ? (
                      <>
                        <SelectItem value="Tersedia">Tersedia</SelectItem>
                        <SelectItem value="Order">Order (Pengambilan)</SelectItem>
                        <SelectItem value="Habis">Habis</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Tersedia">Tersedia</SelectItem>
                        <SelectItem value="Bagus">Bagus</SelectItem>
                        <SelectItem value="Rusak">Rusak</SelectItem>
                        <SelectItem value="Perlu di Retur">Perlu di Retur</SelectItem>
                        <SelectItem value="Dipinjam">Dipinjam</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.category === 'bahan' 
                    ? 'Status untuk manajemen bahan bangunan'
                    : 'Status untuk kondisi dan ketersediaan alat'
                  }
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Item Inventory?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus item "{itemToDelete?.item_name}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Breakdown by Supplier Dialog */}
        <Dialog open={breakdownDialog} onOpenChange={setBreakdownDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Breakdown Stok: {breakdownData?.item_name}
              </DialogTitle>
            </DialogHeader>
            
            {breakdownData && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <p className="text-xs text-green-700 font-medium">Di Gudang</p>
                      <p className="text-2xl font-bold text-green-900">{breakdownData.total_in_warehouse}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-4">
                      <p className="text-xs text-orange-700 font-medium">Belum Sampai</p>
                      <p className="text-2xl font-bold text-orange-900">{breakdownData.total_out_warehouse}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <p className="text-xs text-blue-700 font-medium">Total</p>
                      <p className="text-2xl font-bold text-blue-900">{breakdownData.total_quantity}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdown Table */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Breakdown Per Toko:</h3>
                  {breakdownData.breakdown && breakdownData.breakdown.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr className="text-left text-sm">
                            <th className="px-4 py-3 font-semibold">Nama Toko</th>
                            <th className="px-4 py-3 font-semibold text-right">Di Gudang</th>
                            <th className="px-4 py-3 font-semibold text-right">Belum Sampai</th>
                            <th className="px-4 py-3 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdownData.breakdown.map((item, index) => (
                            <tr key={index} className="border-t hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium">{item.supplier}</td>
                              <td className="px-4 py-3 text-right text-green-600 font-semibold">{item.in_warehouse}</td>
                              <td className="px-4 py-3 text-right text-orange-600 font-semibold">{item.out_warehouse}</td>
                              <td className="px-4 py-3 text-right text-blue-600 font-bold">{item.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                      <p>Belum ada data breakdown per toko</p>
                      <p className="text-sm mt-1">Pastikan mengisi "Nama Toko" saat input transaksi</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setBreakdownDialog(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Price Comparison Dialog */}
        <Dialog open={priceComparisonDialog} onOpenChange={setPriceComparisonDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                💰 Perbandingan Harga: {selectedItemPriceComparison?.item_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedItemPriceComparison && (
              <div className="space-y-4">
                {/* Item Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Satuan</p>
                      <p className="text-lg font-semibold">{selectedItemPriceComparison.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Supplier</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {selectedItemPriceComparison.suppliers.length} supplier
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Selisih Harga</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {selectedItemPriceComparison.suppliers.length > 0 && 
                          formatCurrency(
                            selectedItemPriceComparison.suppliers[selectedItemPriceComparison.suppliers.length - 1].latest_price - 
                            selectedItemPriceComparison.suppliers[0].latest_price
                          )
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Suppliers Table */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Daftar Harga Per Supplier:</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr className="text-left text-sm">
                          <th className="px-4 py-3 font-semibold">Nama Toko/Supplier</th>
                          <th className="px-4 py-3 font-semibold text-right">Harga Terakhir</th>
                          <th className="px-4 py-3 font-semibold text-right">Harga Rata-rata</th>
                          <th className="px-4 py-3 font-semibold text-center">Jumlah Transaksi</th>
                          <th className="px-4 py-3 font-semibold text-center">Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItemPriceComparison.suppliers.map((supplier, index) => {
                          const isLowest = index === 0;
                          const isHighest = index === selectedItemPriceComparison.suppliers.length - 1;
                          
                          return (
                            <tr key={index} className={`border-t hover:bg-slate-50 ${isLowest ? 'bg-green-50' : ''}`}>
                              <td className="px-4 py-3 font-medium">{supplier.supplier}</td>
                              <td className="px-4 py-3 text-right font-bold">
                                {formatCurrency(supplier.latest_price)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                {formatCurrency(supplier.average_price)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs">
                                  {supplier.transaction_count}x
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isLowest && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    ✓ Termurah
                                  </span>
                                )}
                                {isHighest && selectedItemPriceComparison.suppliers.length > 1 && (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Termahal
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Catatan:</strong> Harga terakhir adalah harga dari transaksi terbaru. 
                      Harga rata-rata dihitung dari semua transaksi dengan supplier tersebut.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setPriceComparisonDialog(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminInventory;

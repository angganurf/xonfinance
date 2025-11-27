import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import api from '../../utils/api';

const RABDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rab, setRab] = useState(null);
  const [planningProjects, setPlanningProjects] = useState([]);
  const [unitPrices, setUnitPrices] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState({});
  const [filteredSuggestions, setFilteredSuggestions] = useState({});

  const [formData, setFormData] = useState({
    project_name: '',
    location: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // Load planning projects
      const projectsRes = await api.get('/planning-projects');
      setPlanningProjects(projectsRes.data);

      // Load unit prices
      const pricesRes = await api.get('/unit-prices');
      setUnitPrices(pricesRes.data);

      if (id && id !== 'new') {
        // Load existing RAB
        const rabRes = await api.get(`/rabs/${id}`);
        setRab(rabRes.data);
        setFormData({
          project_name: rabRes.data.project_name,
          location: rabRes.data.location || ''
        });
        setTaxPercentage(rabRes.data.tax_percentage || 0);

        // Load RAB items
        const itemsRes = await api.get(`/rab-items?rab_id=${id}`);
        setItems(itemsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    const project = planningProjects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setFormData({
        project_name: project.name,
        location: project.location || ''
      });
    }
  };

  const addCategory = () => {
    const categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const usedCategories = items.filter(item => item.item_number.length === 1).map(item => item.item_number);
    const nextCategory = categories.find(cat => !usedCategories.includes(cat));
    
    if (!nextCategory) {
      toast.error('Maksimal 8 kategori');
      return;
    }

    const newCategory = {
      id: `temp-${Date.now()}`,
      rab_id: id || 'new',
      category: '',
      item_number: nextCategory,
      description: '',
      unit: '',
      volume: 0,
      unit_price: 0,
      total_price: 0,
      is_category: true
    };

    setItems([...items, newCategory]);
  };

  const addItem = (afterIndex) => {
    // Find the category this item belongs to
    const categoryItem = items[afterIndex];
    if (!categoryItem.is_category) return;

    const categoryLetter = categoryItem.item_number;
    const itemsInCategory = items.filter(item => 
      item.item_number.startsWith(categoryLetter) && !item.is_category
    );
    const nextNumber = itemsInCategory.length + 1;

    const newItem = {
      id: `temp-${Date.now()}`,
      rab_id: id || 'new',
      category: categoryItem.category,
      item_number: `${categoryLetter}.${nextNumber}`,
      description: '',
      unit: 'LS',
      volume: 1,
      unit_price: 0,
      total_price: 0,
      is_category: false
    };

    const newItems = [...items];
    newItems.splice(afterIndex + itemsInCategory.length + 1, 0, newItem);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-calculate total_price
    if (field === 'volume' || field === 'unit_price') {
      const volume = parseFloat(newItems[index].volume) || 0;
      const unitPrice = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total_price = volume * unitPrice;
    }

    // Handle autocomplete for description
    if (field === 'description' && !newItems[index].is_category) {
      if (value.trim().length > 0) {
        const filtered = unitPrices.filter(price =>
          price.description.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions({ ...filteredSuggestions, [index]: filtered });
        setShowSuggestions({ ...showSuggestions, [index]: filtered.length > 0 });
      } else {
        setShowSuggestions({ ...showSuggestions, [index]: false });
      }
    }

    setItems(newItems);
  };

  const selectSuggestion = (index, unitPrice) => {
    const newItems = [...items];
    newItems[index].description = unitPrice.description;
    newItems[index].unit = unitPrice.unit;
    newItems[index].unit_price = unitPrice.price;
    newItems[index].category = unitPrice.category;
    
    // Recalculate total
    const volume = parseFloat(newItems[index].volume) || 0;
    newItems[index].total_price = volume * unitPrice.price;
    
    setItems(newItems);
    setShowSuggestions({ ...showSuggestions, [index]: false });
  };

  const deleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      if (!item.is_category) {
        return sum + (item.total_price || 0);
      }
      return sum;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * taxPercentage) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSave = async () => {
    try {
      // Validate
      if (!formData.project_name.trim()) {
        toast.error('Judul RAB harus diisi');
        return;
      }

      if (items.length === 0) {
        toast.error('Tambahkan minimal 1 item pekerjaan');
        return;
      }

      // Save RAB
      const rabData = {
        project_name: formData.project_name,
        location: formData.location,
        project_id: selectedProject?.id,
        project_type: selectedProject?.type || 'interior',
        tax_percentage: taxPercentage,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        total_price: calculateTotal()
      };

      let rabId = id;
      if (!id || id === 'new') {
        // Create new RAB
        const createRes = await api.post('/rabs', {
          project_name: rabData.project_name,
          location: rabData.location,
          project_type: rabData.project_type,
          client_name: selectedProject?.client_name || ''
        });
        rabId = createRes.data.id;
      }

      // Update RAB with totals
      await api.patch(`/rabs/${rabId}`, {
        tax_percentage: rabData.tax_percentage,
        subtotal: rabData.subtotal,
        tax_amount: rabData.tax_amount,
        total_price: rabData.total_price
      });

      // Delete all existing items
      const existingItems = await api.get(`/rab-items?rab_id=${rabId}`);
      await Promise.all(
        existingItems.data.map(item => api.delete(`/rab-items/${item.id}`))
      );

      // Save all items
      await Promise.all(
        items.map(item => {
          const itemData = {
            rab_id: rabId,
            category: item.category,
            item_number: item.item_number,
            description: item.description,
            unit: item.unit,
            volume: parseFloat(item.volume) || 0,
            unit_price: parseFloat(item.unit_price) || 0,
            total_price: parseFloat(item.total_price) || 0,
            is_category: item.is_category || false
          };
          return api.post('/rab-items', itemData);
        })
      );

      toast.success('RAB berhasil disimpan');
      navigate('/planning/rab');
    } catch (error) {
      console.error('Error saving RAB:', error);
      toast.error('Gagal menyimpan RAB');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  // Format number with thousand separators (dots)
  const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse formatted number back to plain number
  const parseFormattedNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/\./g, '')) || 0;
  };

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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/planning/rab')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {id && id !== 'new' && rab ? `Edit RAB: ${rab.project_name}` : 'Buat RAB Baru'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Rencana Anggaran Biaya</p>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" /> Simpan RAB
          </Button>
        </div>

        {/* Form Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Informasi Proyek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Pilih dari Daftar Perencanaan (Optional)</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={selectedProject?.id || ''}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                >
                  <option value="">-- Pilih Proyek --</option>
                  {planningProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.type})
                    </option>
                  ))}
                </select>
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Judul RAB *</Label>
                <Input
                  required
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="Nama proyek atau judul RAB"
                />
              </div>
              <div>
                <Label>Lokasi</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Lokasi proyek"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAB Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Daftar Item Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2">
                  <tr>
                    <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold w-16">NO</th>
                    <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold">DESKRIPSI</th>
                    <th className="px-2 sm:px-3 py-3 text-center text-xs font-semibold w-24">SATUAN</th>
                    <th className="px-2 sm:px-3 py-3 text-right text-xs font-semibold w-24">VOLUME</th>
                    <th className="px-2 sm:px-3 py-3 text-right text-xs font-semibold w-32">HARGA SATUAN</th>
                    <th className="px-2 sm:px-3 py-3 text-right text-xs font-semibold w-32">JUMLAH</th>
                    <th className="px-2 sm:px-3 py-3 text-center text-xs font-semibold w-24">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        <p>Belum ada item</p>
                        <p className="text-xs mt-1">Klik "Tambah Kategori" untuk memulai</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id || index} className="border-b hover:bg-slate-50">
                        <td className="px-2 sm:px-3 py-2 font-semibold">
                          {item.is_category ? item.item_number : item.item_number}
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          {item.is_category ? (
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Nama Kategori (contoh: Pekerjaan Persiapan)"
                              className="font-semibold"
                            />
                          ) : (
                            <div className="relative">
                              <Input
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                onFocus={() => {
                                  if (item.description.trim().length > 0 && filteredSuggestions[index]?.length > 0) {
                                    setShowSuggestions({ ...showSuggestions, [index]: true });
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setShowSuggestions({ ...showSuggestions, [index]: false });
                                  }, 200);
                                }}
                                placeholder="Ketik nama pekerjaan..."
                                className="text-xs sm:text-sm"
                              />
                              
                              {showSuggestions[index] && filteredSuggestions[index]?.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                  {filteredSuggestions[index].map((unitPrice, i) => (
                                    <div
                                      key={i}
                                      onClick={() => selectSuggestion(index, unitPrice)}
                                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex items-center gap-2"
                                    >
                                      <span className="text-xs text-green-600">✓</span>
                                      <div className="flex-1">
                                        <p className="text-xs sm:text-sm font-medium">{unitPrice.description}</p>
                                        <p className="text-xs text-slate-500">{unitPrice.unit} - {formatCurrency(unitPrice.price)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-center">
                          {!item.is_category && (
                            <Input
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="text-center text-xs w-20"
                            />
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          {!item.is_category && (
                            <Input
                              type="number"
                              step="0.01"
                              value={item.volume}
                              onChange={(e) => handleItemChange(index, 'volume', e.target.value)}
                              className="text-right text-xs w-20"
                            />
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          {!item.is_category && (
                            <Input
                              type="number"
                              step="1000"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              className="text-right text-xs w-28"
                            />
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right font-semibold">
                          {!item.is_category && formatCurrency(item.total_price)}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.is_category && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addItem(index)}
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(index)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Subtotal (Jumlah):</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Pajak:</span>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <span>%</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{formatCurrency(calculateTax())}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2">
              <span className="text-lg font-bold">Total Setelah Pajak:</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RABDetail;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../utils/api';
import { FileText, Eye, ChevronDown, ChevronRight, DollarSign, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';

const RABList = () => {
  const navigate = useNavigate();
  const [rabs, setRabs] = useState([]);
  const [rabsWithItems, setRabsWithItems] = useState([]);
  const [expandedRabs, setExpandedRabs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [addDialog, setAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rabsRes, itemsRes, projectsRes] = await Promise.all([
        api.get('/rabs'),
        api.get('/rab-items'),
        api.get('/planning-projects')
      ]);
      
      const rabsData = rabsRes.data;
      const itemsData = itemsRes.data;
      setProjects(projectsRes.data);
      
      // Group items by RAB ID and calculate totals
      const rabsWithDetails = rabsData.map(rab => {
        const rabItems = itemsData.filter(item => item.rab_id === rab.id);
        
        // Calculate subtotal from items
        const subtotal = rabItems.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price);
        }, 0);
        
        // Calculate tax (10% default)
        const tax = subtotal * 0.10;
        
        // Calculate total
        const total = subtotal + tax;
        
        return {
          ...rab,
          items: rabItems,
          itemCount: rabItems.length,
          subtotal,
          tax,
          total
        };
      });
      
      setRabs(rabsData);
      setRabsWithItems(rabsWithDetails);
    } catch (error) {
      console.error('Error loading RABs:', error);
      toast.error('Gagal memuat daftar RAB');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_id) {
      toast.error('Pilih proyek terlebih dahulu');
      return;
    }
    
    try {
      // Get project details
      const project = projects.find(p => p.id === formData.project_id);
      if (!project) {
        toast.error('Proyek tidak ditemukan');
        return;
      }
      
      const rabData = {
        project_id: formData.project_id,
        project_name: project.name,
        project_type: project.type,
        client_name: project.client_name || '',
        location: project.location || '',
        name: formData.name || `RAB - ${project.name}`,
        description: formData.description || '',
        notes: formData.notes || '',
        status: 'draft'
      };
      
      const response = await api.post('/rabs', rabData);
      toast.success('RAB berhasil dibuat');
      setAddDialog(false);
      setFormData({
        project_id: '',
        name: '',
        description: '',
        notes: ''
      });
      
      // Navigate to RAB editor
      if (response.data && response.data.id) {
        navigate(`/estimator/rab/${response.data.id}`);
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Error creating RAB:', error);
      toast.error('Gagal membuat RAB');
    }
  };

  const toggleExpand = (rabId) => {
    setExpandedRabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rabId)) {
        newSet.delete(rabId);
      } else {
        newSet.add(rabId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
      review: { label: 'Review', className: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' }
    };
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="rab-list">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Daftar RAB</h2>
            <p className="text-slate-600">Rencana Anggaran Biaya proyek perencanaan</p>
          </div>
          <Dialog open={addDialog} onOpenChange={setAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah RAB
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah RAB Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Proyek *</Label>
                  <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih proyek perencanaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Nama RAB (Opsional)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Kosongkan untuk auto-generate dari nama proyek"
                  />
                </div>
                
                <div>
                  <Label>Deskripsi (Opsional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi RAB"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Catatan (Opsional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Catatan tambahan"
                    rows={2}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddDialog(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    Buat RAB
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card className="shadow-lg">
            <CardContent className="py-12">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : rabsWithItems.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada RAB</h3>
              <p className="text-slate-600 mb-4">
                Belum ada RAB yang dibuat. Klik tombol "Tambah RAB" untuk membuat RAB baru.
              </p>
              <Button onClick={() => setAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah RAB Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rabsWithItems.map(rab => {
              const isExpanded = expandedRabs.has(rab.id);
              
              return (
                <Card key={rab.id} className="shadow-md hover:shadow-lg transition-all">
                  <CardHeader className="cursor-pointer" onClick={() => toggleExpand(rab.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">
                              {rab.name || `RAB - ${rab.project_name}`}
                            </CardTitle>
                            {getStatusBadge(rab.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                            <span>Proyek: {rab.project_name}</span>
                            <span>•</span>
                            <span>{rab.project_type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {rab.itemCount} item
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Total RAB</p>
                          <p className="text-xl font-bold text-blue-600">
                            Rp {rab.total.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/estimator/rab/${rab.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        {/* Items Table */}
                        {rab.items.length > 0 ? (
                          <>
                            <h4 className="font-semibold mb-3 text-slate-700">Daftar Item Pekerjaan:</h4>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead>Uraian Pekerjaan</TableHead>
                                    <TableHead className="text-center">Satuan</TableHead>
                                    <TableHead className="text-right">Volume</TableHead>
                                    <TableHead className="text-right">Harga Satuan</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {rab.items.map((item, index) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">{index + 1}</TableCell>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell className="text-center">{item.unit}</TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right">
                                        Rp {item.unit_price.toLocaleString('id-ID')}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            
                            {/* Summary */}
                            <div className="mt-6 border-t pt-4">
                              <div className="flex justify-end">
                                <div className="w-full max-w-md space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span className="font-semibold">Rp {rab.subtotal.toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Pajak (10%):</span>
                                    <span className="font-semibold">Rp {rab.tax.toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span className="text-slate-800">Total:</span>
                                    <span className="text-blue-600">Rp {rab.total.toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-slate-500 mb-3">Belum ada item pekerjaan</p>
                            <Button 
                              size="sm"
                              onClick={() => navigate(`/estimator/rab/${rab.id}`)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Tambah Item
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RABList;

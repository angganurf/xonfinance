import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import api from '../../utils/api';
import { Package, Layers, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalValue: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      const items = res.data;
      
      // Calculate stats
      const totalItems = items.length;
      const lowStock = items.filter(item => item.quantity < 10).length;
      const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const categories = new Set(items.map(item => item.category)).size;
      
      setStats({
        totalItems,
        lowStock,
        totalValue,
        categories
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Gagal memuat statistik inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Inventory</h2>
          <p className="text-slate-600">Statistik dan informasi inventory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Items */}
          <Card className="shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm">Total Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-4xl font-bold text-blue-600">{stats.totalItems}</p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card className="shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm">Stok Rendah</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-4xl font-bold text-red-600">{stats.lowStock}</p>
              )}
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm">Total Nilai</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-slate-200 rounded w-3/4"></div>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {stats.totalValue.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Nilai total inventory</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="shadow-lg border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm">Kategori</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-4xl font-bold text-purple-600">{stats.categories}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/admin/inventory')} className="flex-1">
                <Package className="mr-2 h-4 w-4" />
                Lihat Semua Inventory
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-slate-50">
          <CardContent className="py-8">
            <div className="text-center">
              <Package className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Dashboard Inventory</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Dashboard ini menampilkan statistik inventory secara real-time. 
                Klik tombol di atas untuk mengelola inventory secara lengkap.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryDashboard;

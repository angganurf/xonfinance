import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import api from '../../utils/api';
import { FileText, Building2, Eye, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';

const RABList = () => {
  const navigate = useNavigate();
  const [rabs, setRabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRABs();
  }, []);

  const loadRABs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rabs');
      setRabs(res.data);
    } catch (error) {
      console.error('Error loading RABs:', error);
      toast.error('Gagal memuat daftar RAB');
    } finally {
      setLoading(false);
    }
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
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Daftar RAB</h2>
          <p className="text-slate-600">Rencana Anggaran Biaya proyek perencanaan</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rabs.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada RAB</h3>
              <p className="text-slate-600 mb-4">
                Belum ada RAB yang dibuat. RAB akan otomatis terbuat saat proyek perencanaan dibuat.
              </p>
              <Button onClick={() => navigate('/estimator/dashboard')}>
                Buka Estimator Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rabs.map(rab => (
              <Card 
                key={rab.id} 
                className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => navigate(`/estimator/rab/${rab.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{rab.project_name}</CardTitle>
                        <p className="text-sm text-slate-500">{rab.project_type}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rab.client_name && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4" />
                        <span>{rab.client_name}</span>
                      </div>
                    )}
                    
                    {rab.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-slate-500">Lokasi:</span>
                        <span>{rab.location}</span>
                      </div>
                    )}
                    
                    {rab.total_cost && rab.total_cost > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          Rp {rab.total_cost.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      {getStatusBadge(rab.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
                      <Package className="h-4 w-4" />
                      <span>Dibuat: {new Date(rab.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    
                    <Button 
                      className="w-full mt-2" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/estimator/rab/${rab.id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail RAB
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RABList;

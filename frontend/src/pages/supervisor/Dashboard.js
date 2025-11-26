import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import api from '../../utils/api';
import { Building2, Calendar, MapPin, Eye, TrendingUp } from 'lucide-react';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      waiting: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Aktif', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Selesai', className: 'bg-blue-100 text-blue-700' }
    };
    const variant = variants[status] || variants.waiting;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="supervisor-dashboard">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Supervisor</h2>
          <p className="text-slate-600">Daftar Proyek Pelaksanaan</p>
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
        ) : projects.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Proyek</h3>
              <p className="text-slate-600">Belum ada proyek pelaksanaan yang tersedia.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Card 
                key={project.id} 
                className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => navigate(`/admin/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                        <p className="text-sm text-slate-500">{project.type}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{project.location}</span>
                      </div>
                    )}
                    
                    {project.duration && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>{project.duration} hari</span>
                      </div>
                    )}
                    
                    {project.project_value && project.project_value > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Rp {project.project_value.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      {getStatusBadge(project.status)}
                    </div>
                    
                    <Button 
                      className="w-full mt-2" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/projects/${project.id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail
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

export default SupervisorDashboard;

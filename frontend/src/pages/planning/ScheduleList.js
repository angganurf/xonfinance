import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import api from '../../utils/api';
import { Calendar, Building2, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ScheduleList = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      // Get all schedule items grouped by project
      const res = await api.get('/schedule-items');
      const items = res.data;
      
      // Group by project_id
      const grouped = items.reduce((acc, item) => {
        if (!acc[item.project_id]) {
          acc[item.project_id] = {
            project_id: item.project_id,
            project_name: item.project_name,
            items: []
          };
        }
        acc[item.project_id].items.push(item);
        return acc;
      }, {});
      
      // Convert to array and calculate progress
      const scheduleList = Object.values(grouped).map(schedule => {
        const totalItems = schedule.items.length;
        const completedItems = schedule.items.filter(item => item.status === 'completed').length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        return {
          ...schedule,
          totalItems,
          completedItems,
          progress
        };
      });
      
      setSchedules(scheduleList);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Gagal memuat daftar schedule');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress > 0) return 'bg-orange-600';
    return 'bg-slate-400';
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="schedule-list">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Daftar Time Schedule</h2>
          <p className="text-slate-600">Jadwal pekerjaan proyek perencanaan</p>
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
        ) : schedules.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Schedule</h3>
              <p className="text-slate-600 mb-4">
                Belum ada time schedule yang dibuat. Schedule akan otomatis terbuat saat proyek dibuat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map(schedule => (
              <Card 
                key={schedule.project_id} 
                className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-orange-500"
                onClick={() => navigate(`/admin/projects/${schedule.project_id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{schedule.project_name}</CardTitle>
                        <p className="text-sm text-slate-500">
                          {schedule.totalItems} item pekerjaan
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Progress:</span>
                        <span className="text-lg font-bold text-orange-600">{schedule.progress}%</span>
                      </div>
                      <Progress value={schedule.progress} className="h-2" />
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Total Item</p>
                          <p className="text-sm font-bold text-slate-800">{schedule.totalItems}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-slate-500">Selesai</p>
                          <p className="text-sm font-bold text-green-600">{schedule.completedItems}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      {schedule.progress === 100 ? (
                        <Badge className="bg-green-100 text-green-700">Selesai</Badge>
                      ) : schedule.progress > 0 ? (
                        <Badge className="bg-orange-100 text-orange-700">Dalam Proses</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700">Belum Mulai</Badge>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-2" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/projects/${schedule.project_id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail Schedule
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

export default ScheduleList;

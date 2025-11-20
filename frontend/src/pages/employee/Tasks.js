import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const EmployeeTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [open, setOpen] = useState(false);
  const [reportData, setReportData] = useState({ report: '', progress: '0' });

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    try {
      const response = await api.get(`/tasks?assigned_to=${user.id}`);
      setTasks(response.data);
    } catch (error) {
      toast.error('Gagal memuat tugas');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Status berhasil diupdate');
      loadTasks();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/${selectedTask.id}/report`, {
        report: reportData.report,
        progress: parseInt(reportData.progress),
        photos: []
      });
      toast.success('Laporan berhasil dikirim');
      setOpen(false);
      setReportData({ report: '', progress: '0' });
      loadTasks();
    } catch (error) {
      toast.error('Gagal mengirim laporan');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="tasks-page">
        <h2 className="text-2xl font-bold text-slate-800">Tugas Saya</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="tasks-grid">
          {tasks.map((task) => (
            <Card key={task.id} data-testid={`task-card-${task.id}`}>
              <CardHeader>
                <CardTitle className="text-lg">{task.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{task.description}</p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      task.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>{task.status}</span>
                  </p>
                  {task.due_date && (
                    <p className="text-sm"><span className="font-medium">Deadline:</span> {task.due_date.split('T')[0]}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  {task.status === 'pending' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'in_progress')} data-testid={`start-task-${task.id}`}>
                      Mulai
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <Button size="sm" onClick={() => { setSelectedTask(task); setOpen(true); }} data-testid={`report-task-${task.id}`}>
                        Laporan
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(task.id, 'completed')} data-testid={`complete-task-${task.id}`}>
                        Selesai
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent data-testid="report-dialog">
            <DialogHeader>
              <DialogTitle>Laporan Pekerjaan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <Label>Laporan</Label>
                <Textarea value={reportData.report} onChange={(e) => setReportData({...reportData, report: e.target.value})} required data-testid="report-text-input" rows={5} />
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input type="number" min="0" max="100" value={reportData.progress} onChange={(e) => setReportData({...reportData, progress: e.target.value})} required data-testid="report-progress-input" />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-report-btn">Kirim Laporan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EmployeeTasks;
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Plus, CheckCircle, Circle, Trash2, Clock, CheckCheck } from 'lucide-react';
import api from '../../utils/api';

const DrafterDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    duration_days: 30
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks?role=drafter');
      setTasks(res.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        role: 'drafter',
        status: 'pending'
      };
      
      await api.post('/tasks', data);
      toast.success('Task berhasil ditambahkan!');
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        duration_days: 30
      });
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Gagal menambahkan task');
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      loadTasks();
      toast.success('Status task berhasil diubah');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Gagal mengubah status task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Hapus task ini?')) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task berhasil dihapus');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Gagal menghapus task');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'planning': 'bg-blue-100 text-blue-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-slate-100 text-slate-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Ongoing',
      'planning': 'Planning',
      'on_hold': 'On Hold',
      'completed': 'Finish',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-red-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Drafter</h2>
          <p className="text-sm text-slate-600 mt-1">Kelola tugas dan proyek perencanaan</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Task</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tugas / To-Do List</CardTitle>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Circle className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                <p>Belum ada task</p>
                <p className="text-sm mt-1">Klik "Tambah Task" untuk membuat to-do list</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 ${
                      task.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="flex-shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </p>
                        <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'high' ? '🔴 High' : task.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        {task.start_date && (
                          <span className="text-slate-500 flex items-center gap-1">
                            📅 Mulai: {formatDate(task.start_date)}
                          </span>
                        )}
                        {task.duration_days && (
                          <span className="text-blue-600 font-medium flex items-center gap-1">
                            ⏱️ {task.duration_days} hari
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`font-medium flex items-center gap-1 ${
                            new Date(task.due_date) < new Date() && task.status !== 'completed'
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            <Clock className="h-3 w-3" /> Deadline: {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Add Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Task Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Label>Judul Task *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Contoh: Buat desain lantai 1"
                required
              />
            </div>

            <div>
              <Label>Deskripsi</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detail task..."
              />
            </div>

            <div>
              <Label>Prioritas</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData({...formData, priority: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Durasi Pengerjaan (Hari)</Label>
              <Input
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                placeholder="Contoh: 30"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Deadline akan otomatis dihitung dari hari ini + durasi pengerjaan
                {formData.duration_days && (
                  <span className="text-blue-600 font-medium ml-1">
                    → Deadline: {new Date(Date.now() + formData.duration_days * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Tambah Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DrafterDashboard;

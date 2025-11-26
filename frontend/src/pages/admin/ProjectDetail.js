import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Building2, MapPin, Calendar, DollarSign, FileText, TrendingUp, Users, Package, MessageCircle, Send, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [statistics, setStatistics] = useState({
    transactions: { count: 0, total: 0 },
    inventory: { count: 0 },
    tasks: { count: 0, completed: 0 },
    rab: null
  });
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadProjectDetail();
    loadStatistics();
    loadComments();
    loadUsers();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjectDetail = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Gagal memuat detail proyek');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const transRes = await api.get(`/transactions?project_id=${id}`);
      const transactions = transRes.data;
      const totalExpense = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

      const invRes = await api.get(`/inventory?project_id=${id}`);
      const tasksRes = await api.get(`/tasks?project_id=${id}`);
      const tasks = tasksRes.data;
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const rabRes = await api.get(`/rabs?project_id=${id}`);
      const rab = rabRes.data.length > 0 ? rabRes.data[0] : null;

      setStatistics({
        transactions: { count: transactions.length, total: totalExpense },
        inventory: { count: invRes.data.length },
        tasks: { count: tasks.length, completed: completedTasks.length },
        rab: rab
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/projects/${id}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users/search');
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);
    setCursorPosition(e.target.selectionStart);

    const lastAtIndex = value.lastIndexOf('@', e.target.selectionStart);
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1, e.target.selectionStart);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setShowMentionList(true);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (user) => {
    const lastAtIndex = newComment.lastIndexOf('@', cursorPosition);
    const beforeMention = newComment.substring(0, lastAtIndex);
    const afterMention = newComment.substring(cursorPosition);
    const newText = `${beforeMention}@${user.email} ${afterMention}`;
    setNewComment(newText);
    setShowMentionList(false);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (max 5MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendComment = async () => {
    if (!newComment.trim() && selectedImages.length === 0) {
      toast.error('Komentar atau gambar harus diisi');
      return;
    }

    setUploading(true);
    try {
      const mentionRegex = /@([^\s]+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        const email = match[1];
        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
          mentions.push(foundUser.id);
        }
      }

      const formData = new FormData();
      formData.append('message', newComment || '');
      if (mentions.length > 0) {
        mentions.forEach(m => formData.append('mentions', m));
      }
      
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      await api.post(`/projects/${id}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Pesan berhasil dikirim!');
      setNewComment('');
      setSelectedImages([]);
      setImagePreviews([]);
      loadComments();
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus pesan ini?')) return;

    try {
      await api.delete(`/projects/${id}/comments/${commentId}`);
      toast.success('Pesan berhasil dihapus');
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Gagal menghapus pesan');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Kemarin ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      planning: 'bg-yellow-100 text-yellow-800',
      on_hold: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ongoing',
      completed: 'Finish',
      planning: 'Planning',
      on_hold: 'On Hold'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-slate-500 mb-4">Proyek tidak ditemukan</p>
          <Button onClick={() => navigate('/admin/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Proyek
          </Button>
        </div>
      </Layout>
    );
  }

  const taskProgress = statistics.tasks.count > 0 
    ? (statistics.tasks.completed / statistics.tasks.count) * 100 
    : 0;

  const budgetUsage = project.project_value > 0
    ? (statistics.transactions.total / project.project_value) * 100
    : 0;

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/projects')} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Kembali
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">{project.name}</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Detail Proyek & Statistik</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Tipe Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-sm sm:text-lg md:text-xl font-bold capitalize">{project.type}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Lokasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <span className="text-sm sm:text-base md:text-lg font-semibold truncate">{project.location || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Tanggal Mulai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm md:text-base font-semibold">{formatDate(project.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Fase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-sm sm:text-base md:text-lg font-semibold capitalize">{project.phase || 'pelaksanaan'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Overview Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center border-b pb-2 sm:pb-3">
                <span className="text-xs sm:text-sm text-slate-600">Nilai Proyek</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold text-green-600">{formatCurrency(project.project_value)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 sm:pb-3">
                <span className="text-xs sm:text-sm text-slate-600">Total Pengeluaran</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold text-red-600">{formatCurrency(statistics.transactions.total)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 sm:pb-3">
                <span className="text-xs sm:text-sm text-slate-600">Sisa Budget</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold text-blue-600">
                  {formatCurrency(project.project_value - statistics.transactions.total)}
                </span>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm text-slate-600">Penggunaan Budget</span>
                  <span className="text-xs sm:text-sm font-bold">{budgetUsage.toFixed(1)}%</span>
                </div>
                <Progress value={budgetUsage} className="h-2 sm:h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                RAB & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center border-b pb-2 sm:pb-3">
                <span className="text-xs sm:text-sm text-slate-600">Status RAB</span>
                {statistics.rab ? (
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                    statistics.rab.status === 'approved' ? 'bg-green-100 text-green-800' :
                    statistics.rab.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {statistics.rab.status === 'approved' ? 'Approved' : 
                     statistics.rab.status === 'draft' ? 'Draft' : 
                     statistics.rab.status}
                  </span>
                ) : (
                  <span className="text-red-600 text-xs sm:text-sm">Belum ada RAB</span>
                )}
              </div>
              <div className="flex justify-between items-center border-b pb-2 sm:pb-3">
                <span className="text-xs sm:text-sm text-slate-600">Total RAB</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold">
                  {statistics.rab ? formatCurrency(statistics.rab.total_price) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 sm:pb-3">
                <span className="text-xs sm:text-sm text-slate-600">Design Progress</span>
                <span className="text-sm sm:text-lg md:text-xl font-bold text-blue-600">{project.design_progress || 0}%</span>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm text-slate-600">Progress Desain</span>
                  <span className="text-xs sm:text-sm font-bold">{project.design_progress || 0}%</span>
                </div>
                <Progress value={project.design_progress || 0} className="h-2 sm:h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{statistics.transactions.count}</p>
                <p className="text-xs sm:text-sm text-slate-600">Total Transaksi</p>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                  {formatCurrency(statistics.transactions.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{statistics.tasks.count}</p>
                <p className="text-xs sm:text-sm text-slate-600">Total Tasks</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-600">Completed</span>
                  <span className="text-sm sm:text-base md:text-lg font-semibold">{statistics.tasks.completed}</span>
                </div>
                <Progress value={taskProgress} className="h-1.5 sm:h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{statistics.inventory.count}</p>
                <p className="text-xs sm:text-sm text-slate-600">Total Items</p>
                <p className="text-xs sm:text-sm text-slate-500">Material & Peralatan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {project.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Deskripsi Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp-Style Discussion */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Diskusi Proyek
            </CardTitle>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              {comments.length} pesan
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Container */}
            <div className="bg-slate-50 h-[400px] sm:h-[500px] overflow-y-auto p-3 sm:p-4" style={{ backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+)' }}>
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-center">Belum ada pesan</p>
                  <p className="text-xs text-center mt-1">Mulai diskusi sekarang!</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {comments.map((comment) => {
                    const isOwnMessage = comment.user_id === user?.id;
                    return (
                      <div key={comment.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[75%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          {!isOwnMessage && (
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 mt-1">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {comment.user_name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          {/* Message Bubble */}
                          <div className="flex flex-col">
                            <div
                              className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-white text-slate-800 rounded-bl-none border'
                              }`}
                            >
                              {/* Sender Name (only for others' messages) */}
                              {!isOwnMessage && (
                                <p className="font-semibold text-xs sm:text-sm text-blue-600 mb-1">
                                  {comment.user_name}
                                </p>
                              )}
                              
                              {/* Message Text */}
                              {comment.message && (
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                                  {comment.message}
                                </p>
                              )}
                              
                              {/* Images */}
                              {comment.images && comment.images.length > 0 && (
                                <div className={`grid gap-1.5 sm:gap-2 mt-2 ${comment.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                  {comment.images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img}
                                      alt="Attachment"
                                      className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition"
                                      onClick={() => window.open(img, '_blank')}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Time & Delete */}
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className={`text-[10px] sm:text-xs ${
                                  isOwnMessage ? 'text-blue-100' : 'text-slate-500'
                                }`}>
                                  {formatTime(comment.created_at)}
                                </span>
                                {isOwnMessage && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs text-blue-100 hover:text-white"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-2 sm:p-3">
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={preview} alt="Preview" className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 sm:p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                {/* Mention Autocomplete */}
                {showMentionList && (
                  <div className="absolute bottom-full mb-2 w-full bg-white border rounded-lg shadow-lg max-h-40 sm:max-h-48 overflow-y-auto z-10">
                    {users
                      .filter(u => 
                        u.email.toLowerCase().includes(mentionSearch.toLowerCase()) ||
                        u.name.toLowerCase().includes(mentionSearch.toLowerCase())
                      )
                      .slice(0, 5)
                      .map(mentionUser => (
                        <div
                          key={mentionUser.id}
                          onClick={() => insertMention(mentionUser)}
                          className="p-2 sm:p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                        >
                          <p className="font-medium text-xs sm:text-sm">{mentionUser.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-600">{mentionUser.email}</p>
                        </div>
                      ))
                    }
                  </div>
                )}

                <div className="flex items-end gap-1.5 sm:gap-2">
                  {/* Image Upload Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {/* Message Input */}
                  <Textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Ketik pesan..."
                    className="min-h-[36px] max-h-24 resize-none text-xs sm:text-sm py-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                  
                  {/* Send Button */}
                  <Button
                    onClick={handleSendComment}
                    disabled={uploading || (!newComment.trim() && selectedImages.length === 0)}
                    className="bg-blue-600 hover:bg-blue-700 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">
                💡 Tekan Enter untuk kirim, Shift+Enter untuk baris baru
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProjectDetail;

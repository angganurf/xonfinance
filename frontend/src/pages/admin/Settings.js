import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Download, Upload, Database, AlertTriangle, Save, RotateCcw, Trash2, Calendar, User } from 'lucide-react';
import api from '../../utils/api';

const AdminSettings = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [clearDialog, setClearDialog] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setBackupsLoading(true);
    try {
      const res = await api.get('/admin/backups');
      setBackups(res.data);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Gagal memuat daftar backup');
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleExportData = async (format = 'json') => {
    setExportLoading(true);
    try {
      const [projects, transactions, users, inventory, rabs] = await Promise.all([
        api.get('/projects'),
        api.get('/transactions'),
        api.get('/users'),
        api.get('/inventory'),
        api.get('/rabs')
      ]);

      if (format === 'json') {
        const exportData = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          data: {
            projects: projects.data,
            transactions: transactions.data,
            users: users.data,
            inventory: inventory.data,
            rabs: rabs.data
          }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `xon-architect-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Data berhasil di-export (${format.toUpperCase()})!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast.error('File harus berformat JSON');
        return;
      }
      setImportFile(file);
      toast.info('File siap untuk di-import');
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    setImportLoading(true);
    try {
      const text = await importFile.text();
      const importData = JSON.parse(text);

      if (!importData.data) {
        toast.error('Format file tidak valid');
        return;
      }

      let importedCount = 0;

      if (importData.data.projects) {
        for (const project of importData.data.projects) {
          try {
            await api.post('/projects', project);
            importedCount++;
          } catch (error) {
            console.error('Error importing project:', error);
          }
        }
      }

      if (importData.data.transactions) {
        for (const transaction of importData.data.transactions) {
          try {
            await api.post('/transactions', transaction);
            importedCount++;
          } catch (error) {
            console.error('Error importing transaction:', error);
          }
        }
      }

      toast.success(`Import berhasil! ${importedCount} item berhasil di-import`);
      setImportFile(null);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Gagal import data. Pastikan format file benar.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.post('/admin/backup');
      toast.success('Backup berhasil dibuat!');
      loadBackups(); // Reload backup list
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Gagal membuat backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      const res = await api.post(`/admin/restore/${selectedBackup.id}`);
      toast.success('Restore berhasil! Halaman akan dimuat ulang...');
      setRestoreDialog(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Gagal restore backup');
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      await api.delete(`/admin/backups/${backupId}`);
      toast.success('Backup berhasil dihapus');
      loadBackups();
    } catch (error) {
      console.error('Delete backup error:', error);
      toast.error('Gagal menghapus backup');
    }
  };

  const handleClearAllData = async () => {
    try {
      await api.post('/admin/clear-all-data');
      toast.success('Semua data berhasil dihapus');
      setClearDialog(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pengaturan Admin</h2>
          <p className="text-slate-600 mt-1">Kelola backup, export, import, dan hapus data aplikasi</p>
        </div>

        {/* Backup & Restore Section */}
        <Card className="shadow-lg border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Save className="h-5 w-5" />
              Backup & Restore Database
            </CardTitle>
            <CardDescription>
              Buat backup database dengan timestamp dan restore kapan saja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>ℹ️ Info:</strong> Backup akan menyimpan snapshot seluruh database termasuk projects, transactions, inventory, RAB, schedules, dan tasks. Data users tidak akan di-restore untuk keamanan.
              </p>
            </div>
            
            <Button 
              onClick={handleCreateBackup} 
              disabled={backupLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {backupLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Membuat Backup...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Buat Backup Baru
                </span>
              )}
            </Button>

            {/* Backup List */}
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Daftar Backup ({backups.length})
              </h3>
              
              {backupsLoading ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p>Memuat daftar backup...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                  <Database className="mx-auto h-12 w-12 mb-2 text-slate-300" />
                  <p>Belum ada backup</p>
                  <p className="text-sm mt-1">Buat backup pertama Anda untuk keamanan data</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {backups.map((backup) => (
                    <div 
                      key={backup.id} 
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-800">
                              {formatDate(backup.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <User className="h-3 w-3" />
                            <span>Dibuat oleh: {backup.created_by}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                              ID: {backup.id.substring(0, 8)}...
                            </span>
                          </div>
                          {backup.collections_count && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(backup.collections_count).map(([col, count]) => (
                                <span key={col} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {col}: {count}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setRestoreDialog(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBackup(backup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export & Import Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download semua data aplikasi dalam format JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  File export akan berisi:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• Semua data proyek</li>
                  <li>• Semua transaksi</li>
                  <li>• Data pengguna</li>
                  <li>• Data inventory</li>
                  <li>• Data RAB</li>
                </ul>
              </div>
              <Button 
                onClick={() => handleExportData('json')} 
                disabled={exportLoading}
                className="w-full"
              >
                {exportLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exporting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export JSON
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                Import Data
              </CardTitle>
              <CardDescription>
                Upload file JSON untuk menambahkan data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Import akan menambahkan data baru. Pastikan file backup valid untuk menghindari duplikasi.
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="import-file">Pilih File JSON</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
                {importFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {importFile.name} siap di-import
                  </p>
                )}
              </div>
              <Button 
                onClick={handleImportData} 
                disabled={!importFile || importLoading}
                className="w-full"
                variant="outline"
              >
                {importLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    Importing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import Data
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Clear All Data Section */}
        <Card className="shadow-lg border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Database className="h-5 w-5" />
              Hapus Semua Data
            </CardTitle>
            <CardDescription>
              Hapus semua proyek, transaksi, inventory, dan data terkait (kecuali users & backups)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Peringatan: Tindakan ini tidak dapat dibatalkan!
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Pastikan Anda sudah melakukan backup data sebelum menghapus.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setClearDialog(true)}
              variant="destructive"
            >
              <Database className="mr-2 h-4 w-4" />
              Hapus Semua Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restore Backup?
            </DialogTitle>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Perhatian: Data yang ada saat ini akan diganti!
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Semua data akan diganti dengan data dari backup. User accounts akan tetap dipertahankan.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-800 mb-2">Detail Backup:</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><strong>Waktu:</strong> {formatDate(selectedBackup.timestamp)}</p>
                  <p><strong>Dibuat oleh:</strong> {selectedBackup.created_by}</p>
                  <p><strong>ID:</strong> <span className="font-mono text-xs">{selectedBackup.id}</span></p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleRestoreBackup} className="bg-orange-600 hover:bg-orange-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              Ya, Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Data Confirmation Dialog */}
      <AlertDialog open={clearDialog} onOpenChange={setClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data aplikasi? 
              Ini akan menghapus semua proyek, transaksi, inventory, RAB, schedule, dan tasks.
              <br /><br />
              <span className="font-bold text-red-600">
                Tindakan ini TIDAK DAPAT DIBATALKAN!
              </span>
              <br /><br />
              <span className="text-sm text-slate-600">
                Note: User accounts dan backup akan tetap dipertahankan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllData}
              className="bg-red-600 hover:bg-red-700"
            >
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminSettings;

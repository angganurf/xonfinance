import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const Settings = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [clearDialog, setClearDialog] = useState(false);

  const handleExportData = async (format = 'json') => {
    setExportLoading(true);
    try {
      // Get all data
      const [projects, transactions, users] = await Promise.all([
        api.get('/projects'),
        api.get('/transactions'),
        api.get('/users')
      ]);

      if (format === 'json') {
        const exportData = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          data: {
            projects: projects.data,
            transactions: transactions.data,
            users: users.data
          }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `xon-architect-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert transactions to CSV
        const headers = ['Tanggal', 'Proyek', 'Kategori', 'Deskripsi', 'Jumlah', 'Status'];
        let csvContent = headers.join(',') + '\n';
        
        transactions.data.forEach(trans => {
          const project = projects.data.find(p => p.id === trans.project_id);
          const row = [
            trans.transaction_date?.split('T')[0] || '',
            `"${project?.name || '-'}"`,
            trans.category,
            `"${trans.description}"`,
            trans.amount,
            trans.status || ''
          ];
          csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `xon-architect-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }\n\n      toast.success(`Data berhasil di-export (${format.toUpperCase()})!`);\n    } catch (error) {\n      console.error('Export error:', error);\n      toast.error('Gagal export data');\n    } finally {\n      setExportLoading(false);\n    }\n  };

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
      // Read file
      const text = await importFile.text();
      const importData = JSON.parse(text);

      // Validate structure
      if (!importData.data || !importData.data.projects || !importData.data.transactions) {
        toast.error('Format file tidak valid');
        return;
      }

      // Import projects
      for (const project of importData.data.projects) {
        try {
          await api.post('/projects', project);
        } catch (error) {
          console.error('Error importing project:', error);
        }
      }

      // Import transactions
      for (const transaction of importData.data.transactions) {
        try {
          await api.post('/transactions', transaction);
        } catch (error) {
          console.error('Error importing transaction:', error);
        }
      }

      toast.success(`Import berhasil! ${importData.data.projects.length} proyek, ${importData.data.transactions.length} transaksi`);
      setImportFile(null);
      
      // Reload page after 2 seconds
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

  const handleClearAllData = async () => {
    try {
      // Get all data first
      const [projects, transactions] = await Promise.all([
        api.get('/projects'),
        api.get('/transactions')
      ]);

      // Delete all transactions
      const transDeletePromises = transactions.data.map(t => 
        api.delete(`/transactions/${t.id}`)
      );
      await Promise.all(transDeletePromises);

      // Delete all projects
      const projDeletePromises = projects.data.map(p => 
        api.delete(`/projects/${p.id}`)
      );
      await Promise.all(projDeletePromises);

      toast.success('Semua data berhasil dihapus');
      setClearDialog(false);
      
      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Gagal menghapus data');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="settings-page">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
          <p className="text-slate-600 mt-1">Kelola data aplikasi Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Data */}
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
                  <li>• Tanggal export</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleExportData('json')} 
                  disabled={exportLoading}
                  className="w-full"
                  data-testid="export-json-btn"
                >
                  {exportLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Exporting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      JSON
                    </span>
                  )}
                </Button>
                <Button 
                  onClick={() => handleExportData('csv')} 
                  disabled={exportLoading}
                  variant="outline"
                  className="w-full"
                  data-testid="export-csv-btn"
                >
                  {exportLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Exporting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      CSV
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Data */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                Import Data
              </CardTitle>
              <CardDescription>
                Upload file JSON untuk restore data
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
                  data-testid="import-file-input"
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
                data-testid="import-data-btn"
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

        {/* Clear All Data */}
        <Card className="shadow-lg border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Database className="h-5 w-5" />
              Hapus Semua Data
            </CardTitle>
            <CardDescription>
              Hapus semua proyek, transaksi, dan data terkait
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
              data-testid="clear-all-data-btn"
            >
              <Database className="mr-2 h-4 w-4" />
              Hapus Semua Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialog} onOpenChange={setClearDialog}>
        <AlertDialogContent data-testid="clear-all-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data aplikasi? 
              Ini akan menghapus semua proyek, transaksi, RAB, schedule, dan tasks.
              <br /><br />
              <span className="font-bold text-red-600">
                Tindakan ini TIDAK DAPAT DIBATALKAN!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-clear-all">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllData}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-clear-all"
            >
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Settings;
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Download, Upload, Database, RefreshCw, FileDown, FileUp, Save, Trash2 } from 'lucide-react';
import api from '../../utils/api';

const PlanningSettings = () => {
  const [exportDialog, setExportDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExportRAB = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rabs');
      const rabsData = response.data;
      
      // Get all RAB items
      const itemsResponse = await api.get('/rab-items');
      const itemsData = itemsResponse.data;
      
      // Combine RABs with their items
      const exportData = rabsData.map(rab => ({
        ...rab,
        items: itemsData.filter(item => item.rab_id === rab.id)
      }));
      
      // Create downloadable file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rab-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`${exportData.length} RAB berhasil di-export`);
      setExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export RAB');
    } finally {
      setLoading(false);
    }
  };

  const handleImportRAB = async () => {
    if (!importFile) {
      toast.error('Pilih file untuk import');
      return;
    }

    try {
      setLoading(true);
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);
      
      if (!Array.isArray(importData)) {
        throw new Error('Format file tidak valid');
      }
      
      // Import RABs and items
      let successCount = 0;
      for (const rabData of importData) {
        try {
          // Create RAB without items
          const { items, ...rabOnly } = rabData;
          await api.post('/rabs', rabOnly);
          
          // Create items if exists
          if (items && items.length > 0) {
            for (const item of items) {
              await api.post('/rab-items', item);
            }
          }
          successCount++;
        } catch (error) {
          console.error(`Failed to import RAB ${rabData.name}:`, error);
        }
      }
      
      toast.success(`${successCount} dari ${importData.length} RAB berhasil di-import`);
      setImportDialog(false);
      setImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Gagal import RAB. Pastikan format file benar');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      
      // Get all planning-related data
      const [rabsRes, itemsRes, modeling3dRes, shopDrawingRes, schedulesRes] = await Promise.all([
        api.get('/rabs'),
        api.get('/rab-items'),
        api.get('/planning/modeling-3d'),
        api.get('/planning/shop-drawing'),
        api.get('/schedule-items')
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          rabs: rabsRes.data,
          rab_items: itemsRes.data,
          modeling_3d: modeling3dRes.data,
          shop_drawing: shopDrawingRes.data,
          schedules: schedulesRes.data
        }
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planning-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Backup berhasil dibuat');
      setBackupDialog(false);
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Gagal membuat backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast.error('Pilih file backup untuk restore');
      return;
    }

    try {
      setLoading(true);
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);
      
      if (!backupData.data) {
        throw new Error('Format file backup tidak valid');
      }
      
      toast.info('Restore dimulai... Proses ini mungkin memakan waktu');
      
      // Note: This is a simplified restore. In production, you'd want to:
      // 1. Clear existing data (with confirmation)
      // 2. Restore in proper order
      // 3. Handle conflicts
      
      toast.warning('Fitur restore memerlukan implementasi backend khusus untuk menghindari duplikasi data');
      setRestoreDialog(false);
      setRestoreFile(null);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Gagal restore data. Pastikan format file backup benar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Pengaturan Planning Team</h2>
          <p className="text-slate-600">Kelola data RAB, backup, dan restore</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export RAB */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileDown className="h-5 w-5 text-blue-600" />
                </div>
                Export RAB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Download semua data RAB dalam format JSON untuk backup atau transfer data.
              </p>
              <Button 
                onClick={() => setExportDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export RAB
              </Button>
            </CardContent>
          </Card>

          {/* Import RAB */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileUp className="h-5 w-5 text-green-600" />
                </div>
                Import RAB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Upload file JSON untuk mengimport data RAB ke sistem.
              </p>
              <Button 
                onClick={() => setImportDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import RAB
              </Button>
            </CardContent>
          </Card>

          {/* Backup */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Save className="h-5 w-5 text-purple-600" />
                </div>
                Backup Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Backup lengkap semua data planning termasuk RAB, Modeling 3D, Shop Drawing, dan Schedule.
              </p>
              <Button 
                onClick={() => setBackupDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <Database className="mr-2 h-4 w-4" />
                Buat Backup
              </Button>
            </CardContent>
          </Card>

          {/* Restore */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                </div>
                Restore Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Restore data dari file backup yang sudah dibuat sebelumnya.
              </p>
              <Button 
                onClick={() => setRestoreDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restore Backup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Dialog */}
      <AlertDialog open={exportDialog} onOpenChange={setExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Data RAB</AlertDialogTitle>
            <AlertDialogDescription>
              File JSON akan didownload berisi semua data RAB dan item pekerjaan. 
              File ini dapat digunakan untuk backup atau import ke sistem lain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleExportRAB} disabled={loading}>
              {loading ? 'Memproses...' : 'Export'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <AlertDialog open={importDialog} onOpenChange={setImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Data RAB</AlertDialogTitle>
            <AlertDialogDescription>
              Pilih file JSON hasil export untuk mengimport data RAB.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="import-file">File Import (JSON)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportRAB} disabled={loading || !importFile}>
              {loading ? 'Memproses...' : 'Import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Dialog */}
      <AlertDialog open={backupDialog} onOpenChange={setBackupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buat Backup Data Planning</AlertDialogTitle>
            <AlertDialogDescription>
              Backup akan mencakup semua data: RAB, Modeling 3D, Shop Drawing, dan Time Schedule.
              File backup akan didownload dalam format JSON.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackup} disabled={loading}>
              {loading ? 'Memproses...' : 'Buat Backup'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Data dari Backup</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="text-red-600 font-semibold">⚠️ Perhatian!</p>
              <p>Restore akan menambahkan data dari backup ke sistem. Pastikan file backup valid.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="restore-file">File Backup (JSON)</Label>
            <Input
              id="restore-file"
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files[0])}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore} 
              disabled={loading || !restoreFile}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Memproses...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default PlanningSettings;

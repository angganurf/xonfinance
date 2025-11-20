import React from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const AccountingReports = () => {
  return (
    <Layout>
      <div className="space-y-6" data-testid="reports-page">
        <h2 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
        <Card>
          <CardHeader>
            <CardTitle>Laporan Laba Rugi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Fitur laporan keuangan akan segera tersedia</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccountingReports;
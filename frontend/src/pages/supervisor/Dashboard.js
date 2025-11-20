import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar, Briefcase } from 'lucide-react';
import api from '../../utils/api';

const SupervisorDashboard = () => {
  const [stats, setStats] = useState({ projects: 0, schedules: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const projects = await api.get('/projects');
      setStats({ projects: projects.data.length, schedules: 0 });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="supervisor-dashboard">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Site Supervisor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Total Proyek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{stats.projects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Time Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">{stats.schedules}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SupervisorDashboard;
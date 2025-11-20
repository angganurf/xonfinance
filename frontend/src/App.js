import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AccountingDashboard from './pages/accounting/Dashboard';
import AccountingProjects from './pages/accounting/Projects';
import AccountingTransactions from './pages/accounting/Transactions';
import AccountingReports from './pages/accounting/Reports';
import EstimatorDashboard from './pages/estimator/Dashboard';
import EstimatorRAB from './pages/estimator/RAB';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorSchedule from './pages/supervisor/Schedule';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeTasks from './pages/employee/Tasks';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMembers from './pages/admin/Members';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AccountingTransactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rab"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EstimatorRAB />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schedule"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SupervisorSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmployeeTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AccountingReports />
              </ProtectedRoute>
            }
          />

          {/* Accounting Routes */}
          <Route
            path="/accounting"
            element={
              <ProtectedRoute allowedRoles={['accounting', 'admin']}>
                <AccountingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/projects"
            element={
              <ProtectedRoute allowedRoles={['accounting', 'admin']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/transactions"
            element={
              <ProtectedRoute allowedRoles={['accounting', 'admin']}>
                <AccountingTransactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/reports"
            element={
              <ProtectedRoute allowedRoles={['accounting', 'admin']}>
                <AccountingReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/projects/:projectId"
            element={
              <ProtectedRoute allowedRoles={['accounting', 'admin']}>
                {React.createElement(require('./pages/accounting/ProjectDetail').default)}
              </ProtectedRoute>
            }
          />

          {/* Estimator Routes */}
          <Route
            path="/estimator"
            element={
              <ProtectedRoute allowedRoles={['estimator', 'admin']}>
                <EstimatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estimator/rab"
            element={
              <ProtectedRoute allowedRoles={['estimator', 'admin']}>
                <EstimatorRAB />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estimator/projects"
            element={
              <ProtectedRoute allowedRoles={['estimator', 'admin']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />

          {/* Supervisor Routes */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/schedule"
            element={
              <ProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                <SupervisorSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/projects"
            element={
              <ProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/tasks"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <EmployeeTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/reports"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <EmployeeTasks />
              </ProtectedRoute>
            }
          />

          {/* Settings Route - Available for all roles */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
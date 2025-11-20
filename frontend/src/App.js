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
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Accounting Routes */}
          <Route
            path="/accounting"
            element={
              <ProtectedRoute allowedRoles={['accounting']}>
                <AccountingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/projects"
            element={
              <ProtectedRoute allowedRoles={['accounting']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/transactions"
            element={
              <ProtectedRoute allowedRoles={['accounting']}>
                <AccountingTransactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/reports"
            element={
              <ProtectedRoute allowedRoles={['accounting']}>
                <AccountingReports />
              </ProtectedRoute>
            }
          />

          {/* Estimator Routes */}
          <Route
            path="/estimator"
            element={
              <ProtectedRoute allowedRoles={['estimator']}>
                <EstimatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estimator/rab"
            element={
              <ProtectedRoute allowedRoles={['estimator']}>
                <EstimatorRAB />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estimator/projects"
            element={
              <ProtectedRoute allowedRoles={['estimator']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />

          {/* Supervisor Routes */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['site_supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/schedule"
            element={
              <ProtectedRoute allowedRoles={['site_supervisor']}>
                <SupervisorSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/projects"
            element={
              <ProtectedRoute allowedRoles={['site_supervisor']}>
                <AccountingProjects />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/tasks"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/reports"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeTasks />
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
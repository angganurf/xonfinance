import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FolderOpen, CreditCard, FileText, Calendar, CheckSquare, Settings } from 'lucide-react';

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'accounting':
        return [
          { label: 'Dashboard', path: '/accounting', icon: Home },
          { label: 'Proyek', path: '/accounting/projects', icon: FolderOpen },
          { label: 'Transaksi', path: '/accounting/transactions', icon: CreditCard },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'estimator':
        return [
          { label: 'Dashboard', path: '/estimator', icon: Home },
          { label: 'RAB', path: '/estimator/rab', icon: FileText },
          { label: 'Proyek', path: '/estimator/projects', icon: FolderOpen },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'site_supervisor':
        return [
          { label: 'Dashboard', path: '/supervisor', icon: Home },
          { label: 'Schedule', path: '/supervisor/schedule', icon: Calendar },
          { label: 'Proyek', path: '/supervisor/projects', icon: FolderOpen },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'employee':
        return [
          { label: 'Dashboard', path: '/employee', icon: Home },
          { label: 'Tugas', path: '/employee/tasks', icon: CheckSquare },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg lg:hidden z-50" data-testid="mobile-nav">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${menuItems.length}, 1fr)` }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
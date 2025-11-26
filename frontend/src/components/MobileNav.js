import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FolderOpen, CreditCard, FileText, Calendar, Settings, Package, ClipboardList } from 'lucide-react';

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    // Get all roles (support multiple roles)
    const userRoles = user?.roles && user.roles.length > 0 
      ? user.roles 
      : (user?.role ? [user.role] : []);

    // Check current path to determine context
    const currentPath = location.pathname;
    const isAccountingContext = currentPath.startsWith('/accounting');
    const isPlanningContext = currentPath.startsWith('/planning') && !currentPath.startsWith('/planning-projects');
    const isSupervisorContext = currentPath.startsWith('/supervisor');
    const isInventoryContext = currentPath.startsWith('/inventory');

    // If admin in specific context
    if (userRoles.includes('admin') && isAccountingContext) {
      return [
        { label: 'Home', path: '/accounting', icon: Home },
        { label: 'Transaksi', path: '/accounting/transactions', icon: CreditCard },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    if (userRoles.includes('admin') && isPlanningContext) {
      return [
        { label: 'Home', path: '/planning', icon: Home },
        { label: 'RAB', path: '/planning/rab', icon: FileText },
        { label: 'Schedule', path: '/planning/schedule', icon: Calendar },
        { label: 'Settings', path: '/planning/settings', icon: Settings },
      ];
    }

    if (userRoles.includes('admin') && isSupervisorContext) {
      return [
        { label: 'Home', path: '/supervisor', icon: Home },
        { label: 'Admin', path: '/admin', icon: Home },
      ];
    }

    if (userRoles.includes('admin') && isInventoryContext) {
      return [
        { label: 'Home', path: '/inventory', icon: Home },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    // Default admin menu
    if (userRoles.includes('admin')) {
      return [
        { label: 'Home', path: '/admin', icon: Home },
        { label: 'Planning', path: '/admin/planning-projects', icon: ClipboardList },
        { label: 'Proyek', path: '/admin/projects', icon: FolderOpen },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    // Accounting role
    if (userRoles.includes('accounting')) {
      return [
        { label: 'Home', path: '/accounting', icon: Home },
        { label: 'Transaksi', path: '/accounting/transactions', icon: CreditCard },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    // Planning Team role
    if (userRoles.includes('project_planning_team')) {
      return [
        { label: 'Home', path: '/planning', icon: Home },
        { label: 'RAB', path: '/planning/rab', icon: FileText },
        { label: 'Schedule', path: '/planning/schedule', icon: Calendar },
        { label: 'Settings', path: '/planning/settings', icon: Settings },
      ];
    }

    // Supervisor role
    if (userRoles.includes('site_supervisor')) {
      return [
        { label: 'Home', path: '/supervisor', icon: Home },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    // Inventory role
    if (userRoles.includes('inventory')) {
      return [
        { label: 'Home', path: '/inventory', icon: Home },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    return [
      { label: 'Home', path: '/', icon: Home },
      { label: 'Settings', path: '/settings', icon: Settings },
    ];
  };

  const menuItems = getMenuItems();

  // Don't render if no menu items
  if (menuItems.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 lg:hidden z-50" 
      data-testid="mobile-nav"
    >
      <div 
        className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl"
        style={{ boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.25)' }}
      >
        <div 
          className="grid gap-1 p-2" 
          style={{ gridTemplateColumns: `repeat(${Math.min(menuItems.length, 4)}, 1fr)` }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg scale-105'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${
                  isActive ? 'animate-none' : ''
                }`} />
                <span className="text-xs font-medium leading-tight text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;

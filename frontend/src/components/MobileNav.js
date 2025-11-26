import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FolderOpen, CreditCard, FileText, Calendar, Package, ClipboardList, ArrowLeft, DollarSign } from 'lucide-react';

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

    // If admin in specific context - show all menu items from sidebar
    if (userRoles.includes('admin') && isAccountingContext) {
      return [
        { label: 'Home', path: '/accounting', icon: Home },
        { label: 'Transaksi', path: '/accounting/transactions', icon: CreditCard },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
        { label: 'Kembali', path: '/admin', icon: ArrowLeft },
      ];
    }

    if (userRoles.includes('admin') && isPlanningContext) {
      return [
        { label: 'Home', path: '/planning', icon: Home },
        { label: 'RAB', path: '/planning/rab', icon: FileText },
        { label: 'Schedule', path: '/planning/schedule', icon: Calendar },
        { label: 'Kembali', path: '/admin', icon: ArrowLeft },
      ];
    }

    if (userRoles.includes('admin') && isSupervisorContext) {
      return [
        { label: 'Home', path: '/supervisor', icon: Home },
        { label: 'Kembali', path: '/admin', icon: ArrowLeft },
      ];
    }

    if (userRoles.includes('admin') && isInventoryContext) {
      return [
        { label: 'Home', path: '/inventory', icon: Home },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    // Default admin menu - all items from sidebar
    if (userRoles.includes('admin')) {
      return [
        { label: 'Home', path: '/admin', icon: Home },
        { label: 'Perencanaan', path: '/admin/planning-projects', icon: ClipboardList },
        { label: 'Pelaksanaan', path: '/admin/projects', icon: FolderOpen },
        { label: 'Accounting', path: '/admin/accounting-admin', icon: DollarSign },
        { label: 'Transaksi', path: '/admin/transactions', icon: CreditCard },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    // Accounting role - all items from sidebar
    if (userRoles.includes('accounting')) {
      return [
        { label: 'Home', path: '/accounting', icon: Home },
        { label: 'Transaksi', path: '/accounting/transactions', icon: CreditCard },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    // Planning Team role - all items from sidebar
    if (userRoles.includes('project_planning_team')) {
      return [
        { label: 'Home', path: '/planning', icon: Home },
        { label: 'RAB', path: '/planning/rab', icon: FileText },
        { label: 'Schedule', path: '/planning/schedule', icon: Calendar },
      ];
    }

    // Supervisor role - all items from sidebar
    if (userRoles.includes('site_supervisor')) {
      return [
        { label: 'Home', path: '/supervisor', icon: Home },
      ];
    }

    // Inventory role - all items from sidebar
    if (userRoles.includes('inventory')) {
      return [
        { label: 'Home', path: '/inventory', icon: Home },
        { label: 'Inventory', path: '/admin/inventory', icon: Package },
      ];
    }

    return [
      { label: 'Home', path: '/', icon: Home },
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
        className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.25)' }}
      >
        {/* Horizontal Scrollable Menu */}
        <div 
          className="flex gap-1 p-2 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
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
                className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all duration-200 min-w-[80px] flex-shrink-0 ${
                  isActive
                    ? 'text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg scale-105'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${
                  isActive ? 'animate-none' : ''
                }`} />
                <span className="text-xs font-medium leading-tight text-center whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Scroll indicator gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none"></div>
      </div>
      
      {/* CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MobileNav;

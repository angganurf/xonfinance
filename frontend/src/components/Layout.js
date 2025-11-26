import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, LogOut, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import MobileNav from './MobileNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import api from '../utils/api';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // State untuk collapsible groups di admin menu
  const [expandedGroups, setExpandedGroups] = useState({
    accounting: false,
    estimator: false,
    supervisor: false,
    employee: false,
    inventory: false,
    settings: false
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread/count')
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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
    
    // If admin is in accounting context, show accounting menu
    if (userRoles.includes('admin') && isAccountingContext) {
      return {
        type: 'flat',
        items: [
          { label: 'Home', path: '/accounting', icon: '🏠' },
          { label: 'Transaksi', path: '/accounting/transactions', icon: '💳' },
          { label: 'Inventory', path: '/admin/inventory', icon: '📦' },
          { label: 'Kembali ke Admin', path: '/admin', icon: '🔙' }
        ]
      };
    }
    
    // If admin is in planning context, show planning menu
    if (userRoles.includes('admin') && isPlanningContext) {
      return {
        type: 'flat',
        items: [
          { label: 'Home', path: '/planning', icon: '🏠' },
          { label: 'RAB', path: '/planning/rab', icon: '📋' },
          { label: 'Time Schedule', path: '/planning/schedule', icon: '📅' },
          { label: 'Kembali ke Admin', path: '/admin', icon: '🔙' }
        ]
      };
    }
    
    // If admin is in supervisor context, show supervisor menu
    if (userRoles.includes('admin') && isSupervisorContext) {
      return {
        type: 'flat',
        items: [
          { label: 'Home', path: '/supervisor', icon: '🏠' },
          { label: 'Kembali ke Admin', path: '/admin', icon: '🔙' }
        ]
      };
    }
    
    // Default admin interface
    if (userRoles.includes('admin')) {
      return {
        type: 'flat',
        items: [
          { label: 'Home', path: '/admin', icon: '🏠' },
          { label: 'Proyek Perencanaan', path: '/admin/planning-projects', icon: '📋' },
          { label: 'Proyek Pelaksanaan', path: '/admin/projects', icon: '📁' },
          { label: 'Transaksi', path: '/admin/transactions', icon: '💳' },
          { label: 'Inventory', path: '/admin/inventory', icon: '📦' },
          { label: 'Pengaturan', path: '/admin/settings', icon: '⚙️' }
        ]
      };
    }
    
    // For non-admin users with multiple roles, combine menus
    let combinedItems = [];
    
    // Add menu items based on each role user has
    if (userRoles.includes('accounting')) {
      combinedItems.push(
        { label: 'Home', path: '/accounting', icon: '🏠' },
        { label: 'Transaksi', path: '/accounting/transactions', icon: '💳' },
        { label: 'Inventory', path: '/admin/inventory', icon: '📦' },
        { label: 'Pengaturan', path: '/settings', icon: '⚙️' }
      );
    }
    
    if (userRoles.includes('estimator')) {
      combinedItems.push(
        { label: 'Estimator', path: '/estimator', icon: '📐' }
      );
    }
    
    if (userRoles.includes('site_supervisor')) {
      combinedItems.push(
        { label: 'Home', path: '/supervisor', icon: '🏠' },
        { label: 'Pengaturan', path: '/settings', icon: '⚙️' }
      );
    }
    
    if (userRoles.includes('employee')) {
      combinedItems.push(
        { label: 'Dashboard Employee', path: '/employee', icon: '📊' },
        { label: 'Tugas', path: '/employee/tasks', icon: '✓' },
        { label: 'Laporan Employee', path: '/employee/reports', icon: '📝' }
      );
    }
    
    if (userRoles.includes('project_planning_team')) {
      combinedItems.push(
        { label: 'Home', path: '/planning', icon: '🏠' },
        { label: 'RAB', path: '/planning/rab', icon: '📋' },
        { label: 'Time Schedule', path: '/planning/schedule', icon: '📅' },
        { label: 'Pengaturan', path: '/planning/settings', icon: '⚙️' }
      );
    }
    
    // If no roles matched, return default
    if (combinedItems.length === 0) {
      return {
        type: 'simple',
        items: [
          { label: 'Pengaturan', path: '/settings', icon: '⚙️' }
        ]
      };
    }
    
    // Check if any item has children (grouped menu)
    const hasGroupedItems = combinedItems.some(item => item.children);
    
    return {
      type: hasGroupedItems ? 'grouped' : 'simple',
      items: combinedItems
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50" data-testid="layout-container">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 shadow-2xl`}
        data-testid="sidebar"
      >
        <div className="h-full px-4 py-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white" data-testid="sidebar-title">XON Architect</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-slate-700"
              data-testid="sidebar-close-btn"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-2" data-testid="sidebar-nav">
            {(() => {
              const menuData = getMenuItems();
              
              if (menuData.type === 'simple') {
                return menuData.items.map((item) => (
                  item.label === '---' ? (
                    <div key={item.path} className="border-t border-slate-600 my-4"></div>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        location.pathname === item.path
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                ));
              }
              
              // Grouped menu (for admin)
              return menuData.items.map((item, index) => {
                if (item.children) {
                  const isExpanded = expandedGroups[item.group];
                  const hasActiveChild = item.children.some(child => location.pathname === child.path);
                  
                  return (
                    <div key={item.group}>
                      <button
                        onClick={() => toggleGroup(item.group)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                          hasActiveChild || isExpanded
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              data-testid={`nav-link-${child.label.toLowerCase().replace(' ', '-')}`}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                                location.pathname === child.path
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              <span className="text-lg">{child.icon}</span>
                              <span className="text-sm font-medium">{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        location.pathname === item.path
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                }
              });
            })()}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-4 lg:p-6 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-sm mb-6 px-6 py-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="sidebar-toggle-btn"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-slate-800" data-testid="header-title">
                  {(() => {
                    const menuData = getMenuItems();
                    if (menuData.type === 'simple') {
                      return menuData.items.find(item => item.path === location.pathname)?.label || 'Dashboard';
                    } else {
                      // For grouped menu (admin)
                      let foundLabel = null;
                      menuData.items.forEach(item => {
                        if (item.path === location.pathname) {
                          foundLabel = item.label;
                        } else if (item.children) {
                          const child = item.children.find(c => c.path === location.pathname);
                          if (child) foundLabel = child.label;
                        }
                      });
                      return foundLabel || 'Dashboard';
                    }
                  })()}
                </h2>
                <p className="text-sm text-slate-500" data-testid="user-role-text">
                  {user?.role === 'admin' && 'Administrator'}
                  {user?.role === 'accounting' && 'Bagian Keuangan'}
                  {user?.role === 'estimator' && 'Estimator'}
                  {user?.role === 'site_supervisor' && 'Pengawas Lapangan'}
                  {user?.role === 'employee' && 'Karyawan'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600" data-testid="unread-count">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80" data-testid="notifications-dropdown">
                  <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.slice(0, 10).map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => markAsRead(notif.id)}
                        data-testid={`notification-${notif.id}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-gray-300' : 'bg-blue-600'}`} />
                          <span className="font-medium text-sm">{notif.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                      </DropdownMenuItem>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">Tidak ada notifikasi</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.picture} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block font-medium">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-testid="user-menu-dropdown">
                  <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="logout-btn">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main data-testid="main-content" className="pb-20 lg:pb-6">{children}</main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default Layout;
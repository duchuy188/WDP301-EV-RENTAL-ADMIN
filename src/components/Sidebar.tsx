import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Home, 
  Users, 
  UserCog, 
  BarChart3, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  UserCheck,
  UserX,
  BadgeCheck,
  DollarSign,
  MessageSquare,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { cn } from '../lib/utils';
import AuthService from './service/authService';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  {
    name: 'Quản lý Xe và Trạm',
    icon: FaMotorcycle,
    path: '/fleet',
    hasSubmenu: true,
    submenu: [
      { name: 'Trạm xe', icon: BadgeCheck, path: '/fleet/stations' },
      { name: 'Đội xe', icon: FaMotorcycle, path: '/fleet' },
    ],
  },
  { 
    name: 'Quản lý khách hàng', 
    icon: Users, 
    path: '/customers',
    hasSubmenu: true,
    submenu: [
      { name: 'Khách hàng', icon: UserCheck, path: '/customers' },
      { name: 'Khách hàng rủi ro', icon: UserX, path: '/customers/risky' }
    ]
  },
  { 
    name: 'Quản lý nhân viên', 
    icon: UserCog, 
    path: '/staff',
    hasSubmenu: true,
    submenu: [
      { name: 'Nhân viên', icon: Users, path: '/staff' },
      { name: 'Phân công', icon: UserCog, path: '/staff/assignment' }
    ]
  },
  { name: 'Quản lý đặt và thuê xe', icon: BadgeCheck, path: '/staff/rentals' },
  { name: 'Quản lý Thanh toán', icon: DollarSign, path: '/payments' },
  { name: 'Quản lý phản hồi', icon: MessageSquare, path: '/feedback' },
  { name: 'Quản lý báo cáo sự cố', icon: AlertTriangle, path: '/reports' },
  { name: 'Quản lý bảo trì', icon: Wrench, path: '/maintenance' },
  { name: 'Báo cáo & Phân tích', icon: BarChart3, path: '/analytics' },
];

export function Sidebar({ isCollapsed, setIsCollapsed, isMobile }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      window.location.href = '/login';
    } catch (error: any) {
      console.error('❌ Sidebar: Logout error:', error.message);
      // Still redirect even if logout API fails
      window.location.href = '/login';
    }
  };

  const expandSidebar = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isSubmenuExpanded = (menuName: string) => {
    return expandedMenus.includes(menuName);
  };

  const isSubmenuItemActive = (submenu: any[]) => {
    return submenu.some(item => location.pathname === item.path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className={cn(
          'fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-neutral-200 dark:border-gray-700 transition-all duration-300 shadow-lg flex flex-col z-50',
          isCollapsed ? (isMobile ? 'w-0 overflow-hidden' : 'w-20') : (isMobile ? 'w-72' : 'w-72')
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-gray-700">
            <div 
              className={cn(
                'flex items-center cursor-pointer transition-all duration-200',
                isCollapsed ? 'justify-center w-full' : 'space-x-3'
              )}
              onClick={expandSidebar}
            >
              <div className="p-2.5 bg-gradient-to-r from-green-800 to-green-600 rounded-xl hover:from-green-700 hover:to-green-500 transition-all duration-200 hover:scale-105 shadow-md">
                <Zap className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">EV Rental</h1>
                  <p className="text-sm text-neutral-500 dark:text-gray-400">Admin Panel</p>
                </motion.div>
              )}
            </div>
            {!isCollapsed && !isMobile && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                title="Thu nhỏ menu"
              >
                <ChevronLeft className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const hasSubmenu = item.hasSubmenu;
              const isSubmenuActive = hasSubmenu && isSubmenuItemActive(item.submenu || []);
              const isExpanded = hasSubmenu && isSubmenuExpanded(item.name);
              
              if (hasSubmenu) {
                return (
                  <div key={item.name}>
                    {/* Main menu item */}
                    <button
                      onClick={() => !isCollapsed && toggleSubmenu(item.name)}
                    className={cn(
                      'group flex items-center w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative',
                      isSubmenuActive
                      ? 'bg-gradient-to-r from-green-800 to-green-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:transform hover:scale-[1.01]',
                      isCollapsed && 'justify-center px-3'
                    )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6 transition-all duration-200',
                          isSubmenuActive ? 'text-white' : 'text-neutral-500 dark:text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-300',
                          !isCollapsed && 'mr-4'
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="truncate flex-1 text-left"
                          >
                            {item.name}
                          </motion.span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-neutral-500 dark:text-gray-400" />
                          </motion.div>
                        </>
                      )}
                      {isSubmenuActive && !isCollapsed && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute right-2 w-1 h-6 bg-white rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && (
                      <motion.div
                        initial={false}
                        animate={{ 
                          height: isExpanded ? 'auto' : 0,
                          opacity: isExpanded ? 1 : 0
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 mt-1 space-y-1">
                          {item.submenu?.map((subItem) => {
                            const isSubActive = location.pathname === subItem.path;
                            const SubIcon = subItem.icon;
                            
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.path}
                                className={cn(
                                  'group flex items-center rounded-lg px-4 py-2.5 text-sm transition-all duration-200',
                                  isSubActive
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 hover:shadow-sm hover:scale-[1.01]'
                                )}
                              >
                                <SubIcon className="h-4 w-4 mr-3" />
                                <span className="truncate">{subItem.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              }
              
              // Regular menu item (no submenu)
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 hover:shadow-md hover:ring-1 hover:ring-primary-200 dark:hover:ring-primary-800 hover:scale-[1.02]',
                    isCollapsed && 'justify-center px-3'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6 transition-all duration-200',
                      isActive ? 'text-white' : 'text-neutral-500 dark:text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-300',
                      !isCollapsed && 'mr-4'
                    )}
                  />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute right-2 w-1 h-6 bg-white rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-neutral-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className={cn(
                'group flex items-center w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:transform hover:scale-[1.01]',
                isCollapsed && 'justify-center px-3'
              )}
              title={isCollapsed ? 'Đăng xuất' : undefined}
            >
              <LogOut
                className={cn(
                  'h-6 w-6 transition-all duration-200',
                  !isCollapsed && 'mr-4'
                )}
              />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="truncate"
                >
                  Đăng xuất
                </motion.span>
              )}
            </button>
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && !isMobile && (
            <div className="p-4 border-t border-neutral-200 dark:border-gray-700">
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-full p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                title="Mở rộng menu"
              >
                <ChevronRight className="h-5 w-5 text-neutral-500 dark:text-gray-400 mx-auto" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
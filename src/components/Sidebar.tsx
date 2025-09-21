import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Users, 
  UserCog, 
  BarChart3, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { storage } from '../lib/storage';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'Đội xe & Điểm thuê', icon: Car, path: '/fleet' },
  { name: 'Khách hàng', icon: Users, path: '/customers' },
  { name: 'Nhân viên', icon: UserCog, path: '/staff' },
  { name: 'Báo cáo & Phân tích', icon: BarChart3, path: '/analytics' },
];

export function Sidebar({ isCollapsed, setIsCollapsed, isMobile }: SidebarProps) {
  const location = useLocation();

  const handleLogout = () => {
    storage.setAuth(false);
    window.location.href = '/login';
  };

  const expandSidebar = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
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
              <div className="p-2.5 bg-gradient-to-r from-primary-800 to-primary-600 rounded-xl hover:from-primary-700 hover:to-primary-500 transition-all duration-200 hover:scale-105 shadow-md">
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
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 hover:transform hover:scale-[1.01]',
                    isCollapsed && 'justify-center px-3'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6 transition-all duration-200',
                      isActive ? 'text-white' : 'text-neutral-500 dark:text-gray-400 group-hover:text-primary-600',
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
import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export function Header({ onMenuClick, isMobile }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, message: "Xe BMW i3 cần bảo trì", time: "5 phút trước", type: "warning" },
    { id: 2, message: "Khách hàng mới đăng ký", time: "10 phút trước", type: "info" },
    { id: 3, message: "Doanh thu tháng đạt mục tiêu", time: "1 giờ trước", type: "success" }
  ];

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-gray-700 px-4 lg:px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left section - Menu button */}
        <div className="flex items-center space-x-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">

          {/* Theme toggle */}
          <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-gray-800 rounded-xl p-2">
            <Sun className={`h-4 w-4 transition-colors ${isDark ? 'text-neutral-400' : 'text-yellow-500'}`} />
            <Switch
              checked={isDark}
              onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
              className="data-[state=checked]:bg-primary-600"
            />
            <Moon className={`h-4 w-4 transition-colors ${isDark ? 'text-blue-400' : 'text-neutral-400'}`} />
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-neutral-100 dark:hover:bg-gray-800"
            >
              <Bell className="h-5 w-5 text-gray-700 dark:text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{notifications.length}</span>
              </div>
            </Button>
          </div>

          {/* User menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-gray-800 px-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
                <p className="text-xs text-neutral-500 dark:text-gray-400">Quản trị viên</p>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </Button>

            {/* User dropdown menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-neutral-200 dark:border-gray-700 py-2 z-50"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Administrator</p>
                        <p className="text-sm text-neutral-500 dark:text-gray-400">admin@evrental.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors">
                      <Settings className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cài đặt tài khoản</span>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
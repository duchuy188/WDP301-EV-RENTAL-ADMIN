import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Mail, Lock, Zap, Users, Shield, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';


export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      // Navigation will be handled by the AuthProvider/useAuth hook
      navigate('/');
    } catch (error) {
      // Error is handled by useAuth hook and displayed via error state
    }
  };

  return (
    <div className="min-h-screen flex font-inter">
      {/* Left side - Modern EV Illustration */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-500 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black bg-opacity-10" />
        
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-pulse" />
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-pulse delay-1000" />
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse delay-500" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          {/* Main EV Illustration */}
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
            className="relative mb-8"
          >
            <div className="relative">
              <Car className="h-32 w-32 mb-4 drop-shadow-2xl animate-glow" />
              <Zap className="absolute -top-2 -right-2 h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            
            {/* Floating icons around car */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -left-8 top-4"
            >
              <Users className="h-6 w-6 text-primary-100" />
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -right-8 top-8"
            >
              <Shield className="h-6 w-6 text-primary-100" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
              EV Rental
            </h1>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Hệ thống quản lý xe điện<br/>thông minh và bền vững
            </p>
            
            {/* Feature highlights */}
            <div className="space-y-3 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="h-5 w-5 text-primary-200" />
                <span className="text-primary-50">Quản lý đội xe hiện đại</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="h-5 w-5 text-primary-200" />
                <span className="text-primary-50">Theo dõi thời gian thực</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="h-5 w-5 text-primary-200" />
                <span className="text-primary-50">Báo cáo thông minh</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Login form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8 bg-neutral-50 dark:bg-gray-900 relative"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-pattern" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EV Rental</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-large p-8 border border-neutral-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-glow-green">
                <Car className="h-8 w-8 text-white" />
              </div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-poppins"
              >
                Đăng nhập
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-neutral-600 dark:text-gray-400 font-medium"
              >
                Dành cho Quản trị viên
              </motion.p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Form */}
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              onSubmit={handleLogin} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-neutral-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder="Nhập email của bạn"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-neutral-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder="Nhập mật khẩu"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-neutral-600 dark:text-gray-400">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold py-3 h-12 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-glow-green disabled:transform-none disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </Button>
            </motion.form>

            {/* Debug Panel Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showDebug ? 'Ẩn Debug Panel' : 'Hiện Debug Panel'}
              </button>
            </div>
          </motion.div>

          {/* Debug Panel */}
          {showDebug && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
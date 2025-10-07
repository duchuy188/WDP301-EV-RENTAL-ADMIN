import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, User, Mail, Phone, AlertCircle, CheckCircle2, Eye, EyeOff, Copy, Shield, Sparkles, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { UserService } from './service/userService';
import { CreateStaffPayload, CreateStaffResponse } from './service/type/userTypes';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStaffModal({ isOpen, onClose, onSuccess }: CreateStaffModalProps) {
  const [form, setForm] = useState<CreateStaffPayload>({
    fullname: '',
    email: '',
    phone: '',
    role: 'Station Staff'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<CreateStaffResponse | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (key: keyof CreateStaffPayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.fullname.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Email không hợp lệ');
      return;
    }

    // Phone validation (Vietnamese phone number)
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0 hoặc +84)');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(false);
      setRetryAttempt(0);
      setIsRetrying(false);

      // Show warning about slow server after 10 seconds
      const slowServerWarning = setTimeout(() => {
        if (creating && !success) {
          console.log('⚠️ Server đang xử lý chậm, có thể mất thêm thời gian...');
        }
      }, 10000);

      const result = await UserService.createStaff(form);
      
      // Clear the warning timeout
      clearTimeout(slowServerWarning);
      
      setCreatedStaff(result);
      setSuccess(true);
      
      // Auto close after 3 seconds
      timeoutRef.current = setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);

    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo tài khoản';
      setError(errorMessage);
      console.error('Error creating staff:', err);
      
      // If it's a timeout or network error, suggest checking the staff list
      if (errorMessage.includes('có thể đã được tạo thành công')) {
        // Auto refresh staff list after timeout error
        setTimeout(() => {
          onSuccess(); // This will refresh the staff list
        }, 1000);
      }
    } finally {
      setCreating(false);
      setIsRetrying(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!creating) {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Reset form and state
      setForm({
        fullname: '',
        email: '',
        phone: '',
        role: 'Station Staff'
      });
      setError(null);
      setSuccess(false);
      setShowPassword(false);
      setCreatedStaff(null);
      setRetryAttempt(0);
      setIsRetrying(false);
      onClose();
    }
  }, [creating, onClose]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={handleClose}
            style={{ margin: 0, padding: 0 }}
          />

          {/* Modal */}
          <motion.div
            key="create-staff-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[10000] flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white/20">
                        <UserPlus className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tạo tài khoản nhân viên</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Building2 className="h-3 w-3 mr-1" />
                          Station Staff
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Bảo mật cao
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={creating}
                    className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
                {success && createdStaff ? (
                  // Success view with created staff info
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                    >
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                          Tạo tài khoản thành công!
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Nhân viên đã được thêm vào hệ thống
                        </p>
                      </div>
                    </motion.div>

                    {/* Staff Info Card */}
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Thông tin tài khoản đã tạo
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="group p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Họ và tên</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                {createdStaff.user.fullname}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                {createdStaff.user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="group p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                              <Phone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Số điện thoại</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                {createdStaff.user.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Section */}
                    <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Mật khẩu tạm thời
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              Chia sẻ mật khẩu này với nhân viên
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(createdStaff.temporaryPassword)}
                          className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                        >
                          <Copy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={createdStaff.temporaryPassword}
                          readOnly
                          className="font-mono text-sm bg-white dark:bg-gray-700 border-yellow-300 dark:border-yellow-600 focus:border-yellow-500"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-4 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Lưu ý quan trọng:</strong> Nhân viên cần đổi mật khẩu này khi đăng nhập lần đầu tiên để đảm bảo bảo mật.
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1 px-6 py-3 transition-all duration-200 hover:scale-105"
                      >
                        Đóng
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(createdStaff.temporaryPassword)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-200 hover:scale-105"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sao chép mật khẩu
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Form view
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-6">
                      {/* Full Name Field */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span>Họ và tên</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                          </div>
                          <Input
                            type="text"
                            value={form.fullname}
                            onChange={(e) => handleChange('fullname', e.target.value)}
                            placeholder="Nhập họ và tên đầy đủ"
                            className="pl-12 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-green-500" />
                          <span>Email</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                          </div>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="Nhập địa chỉ email"
                            className="pl-12 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone Field */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span>Số điện thoại</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                          </div>
                          <Input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="Nhập số điện thoại (0xxxxxxxxx)"
                            className="pl-12 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Progress Message */}
                    {creating && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              {isRetrying 
                                ? `Đang thử lại... (lần ${retryAttempt}/2)` 
                                : 'Đang tạo tài khoản, vui lòng đợi...'
                              }
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ⏱️ Quá trình này có thể mất 1-2 phút do server xử lý chậm
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                          </div>
                        </div>
                        {error.includes('có thể đã được tạo thành công') && (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onSuccess(); // Refresh staff list
                                handleClose(); // Close modal
                              }}
                              className="text-xs px-4 py-2 h-auto border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Kiểm tra danh sách
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={creating}
                        className="flex-1 px-6 py-3 transition-all duration-200 hover:scale-105"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating || !form.fullname.trim() || !form.email.trim() || !form.phone.trim()}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isRetrying ? `Đang thử lại... (${retryAttempt}/2)` : 'Đang tạo tài khoản...'}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Tạo tài khoản
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

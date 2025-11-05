import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, User, Mail, Phone, AlertCircle, Shield, Sparkles, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { UserService } from './service/userService';
import { CreateStaffPayload } from './service/type/userTypes';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStaffModal({ isOpen, onClose, onSuccess }: CreateStaffModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  const [form, setForm] = useState<CreateStaffPayload>({
    fullname: '',
    email: '',
    phone: '',
    role: 'Station Staff'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleChange = (key: keyof CreateStaffPayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Handle phone number input - chỉ cho phép nhập số
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Chỉ cho phép số và dấu + ở đầu
    const phoneRegex = /^[\+]?[0-9]*$/;
    if (phoneRegex.test(value)) {
      setForm(prev => ({ ...prev, phone: value }));
    }
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
      setRetryAttempt(0);
      setIsRetrying(false);

      await UserService.createStaff(form);
      
      // 1. Close modal immediately
      handleClose();
      
      // 2. Show success toast
      showToast.success(`Tạo tài khoản ${form.fullname} thành công`);
      
      // 3. Refresh data
        onSuccess();

    } catch (err: any) {
      console.error('Error creating staff:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo tài khoản';
      
      // Handle different error types based on our simplified error codes
      if (errorMessage === 'DUPLICATE_EMAIL') {
        setError('Email này đã được sử dụng. Đang kiểm tra xem tài khoản đã được tạo chưa...');
        showToast.warning('Email đã tồn tại - Đang kiểm tra...');
        
        // Always check if staff exists for duplicate email errors
        setTimeout(async () => {
          await checkIfStaffExists();
        }, 1000);
        
      } else if (errorMessage.startsWith('VALIDATION_ERROR:')) {
        const validationMsg = errorMessage.replace('VALIDATION_ERROR: ', '');
        setError(`Lỗi validation: ${validationMsg}. Đang kiểm tra kết quả...`);
        // Modal KHÔNG đóng - để user sửa lỗi
        
        // Check if staff was created despite validation error
        setTimeout(async () => {
          await checkIfStaffExists();
        }, 1000);
        
      } else if (errorMessage === 'TIMEOUT_ERROR') {
        setError('Server phản hồi chậm. Đang kiểm tra xem tài khoản đã được tạo chưa...');
        // Modal KHÔNG đóng - đang kiểm tra
        
        setTimeout(async () => {
          await checkIfStaffExists();
        }, 2000);
        
      } else if (errorMessage === 'NETWORK_ERROR') {
        setError('Lỗi kết nối mạng. Đang kiểm tra xem tài khoản đã được tạo chưa...');
        // Modal KHÔNG đóng - đang kiểm tra
        
        setTimeout(async () => {
          await checkIfStaffExists();
        }, 2000);
        
      } else {
        // Other API errors - still check in case of success
        const cleanMsg = errorMessage.startsWith('API_ERROR: ') ? 
          errorMessage.replace('API_ERROR: ', '') : errorMessage;
        setError(`Lỗi: ${cleanMsg}. Đang kiểm tra kết quả...`);
        showToast.error(cleanMsg);
        // Modal KHÔNG đóng - để user xem lỗi
        
        // Even for other errors, check if creation was successful
        setTimeout(async () => {
          await checkIfStaffExists();
        }, 1500);
      }
    } finally {
      setCreating(false);
      setIsRetrying(false);
    }
  };

  // Helper function to check if staff was actually created
  const checkIfStaffExists = async () => {
    try {
      console.log('Checking if staff exists with email:', form.email);
      const searchResult = await UserService.getUsers({ 
        search: form.email,
        role: 'Station Staff',
        limit: 10 
      });
      
      const staffExists = searchResult.users.some(user => 
        user.email.toLowerCase() === form.email.toLowerCase()
      );
      
      if (staffExists) {
        console.log('✅ Staff found! Creation was actually successful.');
        
        // 1. Close modal immediately
        handleClose();
        
        // 2. Show success toast
        showToast.success(`Tạo tài khoản ${form.fullname} thành công`);
        
        // 3. Refresh data
          onSuccess();
      } else {
        console.log('❌ Staff not found, creation likely failed.');
        setError('Không tìm thấy tài khoản. Vui lòng thử lại.');
        showToast.error('Không thể tạo tài khoản');
        // Modal KHÔNG đóng - để user thử lại
      }
    } catch (verifyError) {
      console.error('Error verifying staff creation:', verifyError);
      setError('Không thể kiểm tra kết quả. Vui lòng kiểm tra danh sách nhân viên.');
      showToast.error('Không thể kiểm tra kết quả');
      // Modal KHÔNG đóng - để user thử lại
    }
  };

  const handleClose = useCallback(() => {
    if (!creating) {
      // Reset form and state
      setForm({
        fullname: '',
        email: '',
        phone: '',
        role: 'Station Staff'
      });
      setError(null);
      setRetryAttempt(0);
      setIsRetrying(false);
      onClose();
    }
  }, [creating, onClose]);


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
                {/* Form view */}
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
                            onChange={handlePhoneChange}
                            placeholder="Nhập số điện thoại (0xxxxxxxxx)"
                            className="pl-12 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                            required
                            maxLength={11}
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>

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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

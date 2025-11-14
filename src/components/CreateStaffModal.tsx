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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleChange = (key: keyof CreateStaffPayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
    // Clear general error
    if (error) {
      setError(null);
    }
  };

  // Handle phone number input - chỉ cho phép nhập số
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Chỉ cho phép số và dấu + ở đầu
    const phoneRegex = /^[\+]?[0-9]*$/;
    if (phoneRegex.test(value)) {
      setForm(prev => ({ ...prev, phone: value }));
      // Clear error when user starts typing
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
      if (error) {
        setError(null);
      }
    }
  };

  const validateForm = (formData: CreateStaffPayload): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    const trimmedFullname = formData.fullname.trim();
    if (!trimmedFullname) {
      newErrors.fullname = 'Họ và tên là bắt buộc';
    } else if (trimmedFullname.length < 2) {
      newErrors.fullname = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (trimmedFullname.length > 100) {
      newErrors.fullname = 'Họ và tên không được vượt quá 100 ký tự';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(trimmedFullname)) {
      newErrors.fullname = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
    }

    // Email validation
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email là bắt buộc';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Email không hợp lệ. Ví dụ: staff@vinfast.vn';
      } else if (trimmedEmail.length > 100) {
        newErrors.email = 'Email không được vượt quá 100 ký tự';
      }
    }

    // Phone validation
    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else {
      const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
      const cleanedPhone = trimmedPhone.replace(/\s/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ. Ví dụ: 0123456789, 0912345678, +84912345678';
      }
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const errorElement = document.getElementById(`field-${firstErrorField}`) ||
                            document.querySelector(`[name="${firstErrorField}"]`);
        
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (errorElement as HTMLElement).focus();
        } else {
          // Fallback: scroll to first error message
          const firstErrorMsg = document.querySelector('.text-red-500');
          if (firstErrorMsg) {
            firstErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim all fields before validation
    const trimmedForm: CreateStaffPayload = {
      ...form,
      fullname: form.fullname.trim(),
      email: form.email.trim(),
      phone: form.phone.trim()
    };
    
    // Validate form with trimmed data
    if (!validateForm(trimmedForm)) {
      // Update form with trimmed values for display
      setForm(trimmedForm);
      return;
    }
    
    // Update form with trimmed values
    setForm(trimmedForm);

    try {
      setCreating(true);
      setError(null);
      setRetryAttempt(0);
      setIsRetrying(false);

      await UserService.createStaff(trimmedForm);
      
      // 1. Close modal immediately
      handleClose();
      
      // 2. Show success toast
      showToast.success(`Tạo tài khoản ${trimmedForm.fullname} thành công`);
      
      // 3. Refresh data
      onSuccess();

    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo tài khoản';
      
      // Handle different error types based on our simplified error codes
      if (errorMessage === 'DUPLICATE_EMAIL') {
        setError('Email này đã được sử dụng. Đang kiểm tra...');
        showToast.warning('Email đã tồn tại - Đang kiểm tra...');
        
        // Check if staff exists - if found, show duplicate message
        setTimeout(async () => {
          await checkIfStaffExists(trimmedForm, true);
        }, 1000);
        
      } else if (errorMessage.startsWith('VALIDATION_ERROR:')) {
        const validationMsg = errorMessage.replace('VALIDATION_ERROR: ', '');
        setError(`Lỗi validation: ${validationMsg}. Đang kiểm tra kết quả...`);
        // Modal KHÔNG đóng - để user sửa lỗi
        
        // Check if staff was created despite validation error
        setTimeout(async () => {
          await checkIfStaffExists(trimmedForm, false);
        }, 1000);
        
      } else if (errorMessage === 'TIMEOUT_ERROR') {
        setError('Server phản hồi chậm. Đang kiểm tra xem tài khoản đã được tạo chưa...');
        // Modal KHÔNG đóng - đang kiểm tra
        
        setTimeout(async () => {
          await checkIfStaffExists(trimmedForm, false);
        }, 2000);
        
      } else if (errorMessage === 'NETWORK_ERROR') {
        setError('Lỗi kết nối mạng. Đang kiểm tra xem tài khoản đã được tạo chưa...');
        // Modal KHÔNG đóng - đang kiểm tra
        
        setTimeout(async () => {
          await checkIfStaffExists(trimmedForm, false);
        }, 2000);
        
      } else {
        // Check if error message contains duplicate/email related keywords
        const lowerErrorMsg = errorMessage.toLowerCase();
        const isDuplicateError = lowerErrorMsg.includes('email') && 
                                (lowerErrorMsg.includes('đã tồn tại') || 
                                 lowerErrorMsg.includes('already exists') || 
                                 lowerErrorMsg.includes('duplicate') ||
                                 lowerErrorMsg.includes('đã được sử dụng'));
        
        if (isDuplicateError) {
          // This is a duplicate email error from backend
          setError(`Tài khoản với email "${trimmedForm.email}" đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.`);
          showToast.error('Email này đã được sử dụng');
          
          // Verify by checking if staff exists
          setTimeout(async () => {
            await checkIfStaffExists(trimmedForm, true);
          }, 1000);
        } else {
          // Other API errors - still check in case of success
          const cleanMsg = errorMessage.startsWith('API_ERROR: ') ? 
            errorMessage.replace('API_ERROR: ', '') : errorMessage;
          setError(`Lỗi: ${cleanMsg}. Đang kiểm tra kết quả...`);
          showToast.error(cleanMsg);
          // Modal KHÔNG đóng - để user xem lỗi
          
          // Even for other errors, check if creation was successful
          setTimeout(async () => {
            await checkIfStaffExists(trimmedForm, false);
          }, 1500);
        }
      }
    } finally {
      setCreating(false);
      setIsRetrying(false);
    }
  };

  // Helper function to check if staff was actually created
  const checkIfStaffExists = async (formData: CreateStaffPayload, isDuplicateCheck: boolean = false) => {
    try {
      const searchResult = await UserService.getUsers({ 
        search: formData.email,
        role: 'Station Staff',
        limit: 10 
      });
      
      const foundStaff = searchResult.users.find(user => 
        user.email.toLowerCase() === formData.email.toLowerCase()
      );
      
      if (foundStaff) {
        // If we're checking because of duplicate email error, show duplicate message
        if (isDuplicateCheck) {
          setError(`Tài khoản với email "${formData.email}" đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.`);
          showToast.error('Email này đã được sử dụng');
          // Modal KHÔNG đóng - để user sửa email
          return;
        }
        
        // Otherwise, creation was successful
        // 1. Close modal immediately
        handleClose();
        
        // 2. Show success toast
        showToast.success(`Tạo tài khoản ${formData.fullname} thành công`);
        
        // 3. Refresh data
        onSuccess();
      } else {
        setError('Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin và thử lại.');
        showToast.error('Không thể tạo tài khoản');
        // Modal KHÔNG đóng - để user thử lại
      }
    } catch (verifyError) {
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
      setErrors({});
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
                            id="field-fullname"
                            name="fullname"
                            type="text"
                            value={form.fullname}
                            onChange={(e) => handleChange('fullname', e.target.value)}
                            placeholder="Nhập họ và tên đầy đủ"
                            className={`pl-12 h-12 transition-all duration-200 ${
                              errors.fullname ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                            }`}
                            required
                          />
                        </div>
                        {errors.fullname && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.fullname}
                          </p>
                        )}
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
                            id="field-email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="Nhập địa chỉ email"
                            className={`pl-12 h-12 transition-all duration-200 ${
                              errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                            }`}
                            required
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.email}
                          </p>
                        )}
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
                            id="field-phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handlePhoneChange}
                            placeholder="Nhập số điện thoại (0xxxxxxxxx)"
                            className={`pl-12 h-12 transition-all duration-200 ${
                              errors.phone ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                            }`}
                            required
                            maxLength={12}
                            inputMode="numeric"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.phone}
                          </p>
                        )}
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
                        disabled={creating}
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

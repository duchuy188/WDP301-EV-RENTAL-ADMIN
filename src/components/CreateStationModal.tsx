import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Phone, AlertCircle, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { stationService } from './service/stationService';
import { CreateStationRequest } from './service/type/stationTypes';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface CreateStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStationModal({ isOpen, onClose, onSuccess }: CreateStationModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStationRequest>({
    name: '',
    address: '',
    district: '',
    city: '',
    description: '',
    phone: '',
    email: '',
    opening_time: '06:00',
    closing_time: '22:00',
    max_capacity: 50,
    images: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tên trạm là bắt buộc';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Tên trạm phải có ít nhất 3 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên trạm không được vượt quá 100 ký tự';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Địa chỉ phải có ít nhất 10 ký tự';
    } else if (formData.address.trim().length > 200) {
      newErrors.address = 'Địa chỉ không được vượt quá 200 ký tự';
    }

    // District validation
    if (!formData.district.trim()) {
      newErrors.district = 'Quận/huyện là bắt buộc';
    } else if (formData.district.trim().length < 2) {
      newErrors.district = 'Quận/huyện phải có ít nhất 2 ký tự';
    } else if (formData.district.trim().length > 50) {
      newErrors.district = 'Quận/huyện không được vượt quá 50 ký tự';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'Thành phố là bắt buộc';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'Thành phố phải có ít nhất 2 ký tự';
    } else if (formData.city.trim().length > 50) {
      newErrors.city = 'Thành phố không được vượt quá 50 ký tự';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else {
      const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
      const cleanedPhone = formData.phone.replace(/\s/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ. Ví dụ: 0123456789, 0912345678, +84912345678';
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedEmail = formData.email.trim();
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Email không hợp lệ. Ví dụ: station@vinfast.vn';
      } else if (trimmedEmail.length > 100) {
        newErrors.email = 'Email không được vượt quá 100 ký tự';
      }
    }

    // Opening time validation
    if (!formData.opening_time) {
      newErrors.opening_time = 'Giờ mở cửa là bắt buộc';
    }

    // Closing time validation
    if (!formData.closing_time) {
      newErrors.closing_time = 'Giờ đóng cửa là bắt buộc';
    }

    // Time range validation: opening time must be before closing time
    if (formData.opening_time && formData.closing_time) {
      const [openHour, openMin] = formData.opening_time.split(':').map(Number);
      const [closeHour, closeMin] = formData.closing_time.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      if (openMinutes >= closeMinutes) {
        newErrors.closing_time = 'Giờ đóng cửa phải sau giờ mở cửa';
      }
    }

    // Max capacity validation
    if (!formData.max_capacity || formData.max_capacity <= 0) {
      newErrors.max_capacity = 'Sức chứa phải lớn hơn 0';
    } else if (formData.max_capacity > 500) {
      newErrors.max_capacity = 'Sức chứa không được vượt quá 500 xe';
    } else if (formData.max_capacity < 1) {
      newErrors.max_capacity = 'Sức chứa tối thiểu là 1 xe';
    }

    // Description validation (optional but if provided, check length)
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Mô tả không được vượt quá 1000 ký tự';
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                            document.getElementById(`field-${firstErrorField}`) ||
                            document.querySelector(`input[placeholder*="${getFieldPlaceholder(firstErrorField)}"]`);
        
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

  const getFieldPlaceholder = (field: string): string => {
    const placeholders: Record<string, string> = {
      name: 'Trạm',
      address: 'Địa chỉ',
      district: 'Quận',
      city: 'TP.HCM',
      phone: '0123456789',
      email: 'station@vinfast.vn'
    };
    return placeholders[field] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim all string fields before validation and submission
    const trimmedFormData: CreateStationRequest = {
      ...formData,
      name: typeof formData.name === 'string' ? formData.name.trim() : formData.name,
      address: typeof formData.address === 'string' ? formData.address.trim() : formData.address,
      district: typeof formData.district === 'string' ? formData.district.trim() : formData.district,
      city: typeof formData.city === 'string' ? formData.city.trim() : formData.city,
      phone: typeof formData.phone === 'string' ? formData.phone.trim() : formData.phone,
      email: typeof formData.email === 'string' ? formData.email.trim() : formData.email,
      description: typeof formData.description === 'string' ? formData.description.trim() : formData.description,
    };
    
    // Temporarily update form data for validation
    const originalFormData = formData;
    setFormData(trimmedFormData);
    
    // Validate with trimmed data
    if (!validateForm()) {
      // Restore original form data if validation fails
      setFormData(originalFormData);
      return;
    }

    try {
      setLoading(true);
      // Submit with trimmed data
      const response = await stationService.createStation(trimmedFormData);
      
      showToast.success('Tạo trạm mới thành công!');
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        district: '',
        city: '',
        description: '',
        phone: '',
        email: '',
        opening_time: '06:00',
        closing_time: '22:00',
        max_capacity: 50,
        images: []
      });
      setErrors({});
      setImagePreviews([]);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo trạm';
      showToast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateStationRequest, value: string | number) => {
    // Don't trim while typing - allow spaces. Trim will be done during validation
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count (max 10 images)
    const currentImageCount = formData.images?.length || 0;
    const totalImages = currentImageCount + files.length;
    
    if (totalImages > 10) {
      showToast.error('Chỉ được tải lên tối đa 10 ảnh');
      return;
    }
    
    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} không phải là file ảnh`);
        return;
      }
      
      // Check file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} vượt quá 5MB`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Show error for invalid files
    if (invalidFiles.length > 0) {
      showToast.error(invalidFiles.join(', '));
    }
    
    // Add valid files
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...validFiles]
      }));
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient - Fixed */}
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Tạo trạm thuê mới
                      </h2>
                      <p className="text-green-100 text-sm mt-1">
                        Thêm trạm thuê xe điện vào hệ thống
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={loading}
                    className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full"
                    title="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6" id="create-station-form">
                  {/* Basic Information */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Thông tin cơ bản</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Tên trạm <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="VD: Trạm thuê xe VinFast Quận 1"
                            className={`${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.name}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Sức chứa tối đa <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-max_capacity"
                            name="max_capacity"
                            type="number"
                            value={formData.max_capacity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value >= 0 && value <= 500) {
                                handleInputChange('max_capacity', value);
                              }
                            }}
                            placeholder="50"
                            min="1"
                            max="500"
                            className={`${errors.max_capacity ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            Tối đa 500 xe
                          </p>
                          {errors.max_capacity && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.max_capacity}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Địa chỉ chi tiết <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="field-address"
                          name="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé"
                          className={`${errors.address ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Quận/Huyện <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-district"
                            name="district"
                            value={formData.district}
                            onChange={(e) => handleInputChange('district', e.target.value)}
                            placeholder="VD: Quận 1"
                            className={`${errors.district ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
                          {errors.district && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.district}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Thành phố <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-city"
                            name="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="VD: TP.HCM"
                            className={`${errors.city ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
                          {errors.city && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.city}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Mô tả trạm
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            ({formData.description?.length || 0}/1000 ký tự)
                          </span>
                        </label>
                        <textarea
                          id="field-description"
                          name="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Mô tả về vị trí, tiện ích và đặc điểm của trạm thuê xe..."
                          className={`w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none ${
                            errors.description ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          rows={3}
                          maxLength={1000}
                        />
                        {errors.description && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Thông tin liên hệ</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Số điện thoại <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-phone"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="0123456789"
                            className={`${errors.phone ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="station@vinfast.vn"
                            className={`${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Operating Hours */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span>Giờ hoạt động</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Giờ mở cửa <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-opening_time"
                            name="opening_time"
                            type="time"
                            value={formData.opening_time}
                            onChange={(e) => handleInputChange('opening_time', e.target.value)}
                            className={`h-11 ${errors.opening_time ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          />
                          {errors.opening_time && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.opening_time}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Giờ đóng cửa <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-closing_time"
                            name="closing_time"
                            type="time"
                            value={formData.closing_time}
                            onChange={(e) => handleInputChange('closing_time', e.target.value)}
                            className={`h-11 ${errors.closing_time ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          />
                          {errors.closing_time && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.closing_time}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Image Upload */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span>Hình ảnh trạm</span>
                        <span className="text-xs text-gray-500 font-normal ml-2">(Tùy chọn, tối đa 10 ảnh)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* Image Upload Button */}
                      <div>
                        <label htmlFor="station-images" className="cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-center">
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">Click để chọn ảnh</span> hoặc kéo thả vào đây
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, JPEG, WEBP (tối đa 5MB mỗi ảnh)
                            </p>
                          </div>
                        </label>
                        <input
                          id="station-images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>

                      {/* Image Preview Grid */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xóa ảnh"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {index + 1}/{imagePreviews.length}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {imagePreviews.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <ImageIcon className="h-4 w-4 mr-1.5 text-purple-600" />
                          Đã chọn {imagePreviews.length}/10 ảnh
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </form>
              </div>

              {/* Fixed Footer - Action Buttons */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    form="create-station-form"
                    disabled={loading}
                    className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Tạo trạm mới
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

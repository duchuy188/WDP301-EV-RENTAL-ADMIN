import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Phone, AlertCircle, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { stationService } from './service/stationService';
import { CreateStationRequest } from './service/type/stationTypes';
import { showToast } from '../lib/toast';

interface CreateStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStationModal({ isOpen, onClose, onSuccess }: CreateStationModalProps) {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Tên trạm là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.district.trim()) newErrors.district = 'Quận/huyện là bắt buộc';
    if (!formData.city.trim()) newErrors.city = 'Thành phố là bắt buộc';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
    if (!formData.opening_time) newErrors.opening_time = 'Giờ mở cửa là bắt buộc';
    if (!formData.closing_time) newErrors.closing_time = 'Giờ đóng cửa là bắt buộc';
    if (!formData.max_capacity || formData.max_capacity <= 0) newErrors.max_capacity = 'Sức chứa phải lớn hơn 0';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Phone validation
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await stationService.createStation(formData);
      
      showToast.success('Tạo trạm mới thành công!');
      console.log('Station created successfully:', response.message);
      
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
      
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo trạm';
      showToast.error(`Lỗi: ${errorMessage}`);
      console.error('Error creating station:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateStationRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
                            type="number"
                            value={formData.max_capacity}
                            onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value) || 0)}
                            placeholder="50"
                            min="1"
                            max="200"
                            className={`${errors.max_capacity ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'} h-11`}
                          />
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
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Mô tả về vị trí, tiện ích và đặc điểm của trạm thuê xe..."
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                          rows={3}
                        />
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
                            type="time"
                            value={formData.opening_time}
                            onChange={(e) => handleInputChange('opening_time', e.target.value)}
                            className="h-11 border-gray-300 dark:border-gray-600"
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
                            type="time"
                            value={formData.closing_time}
                            onChange={(e) => handleInputChange('closing_time', e.target.value)}
                            className="h-11 border-gray-300 dark:border-gray-600"
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

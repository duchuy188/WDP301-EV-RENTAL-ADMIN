import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  DollarSign, 
  FileText, 
  Sparkles,
  Download,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { vehicleService } from './service/vehicleService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';
import type { BulkCreateResponse } from './service/type/vehicleTypes';
import { validateVehicleBulkForm, scrollToFirstError, errorsToRecord, type VehicleBulkFormData } from '../utils/validation';

interface BulkVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkVehicleModal({ isOpen, onClose, onSuccess }: BulkVehicleModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  const [loading, setLoading] = useState(false);
  
  // Bulk Create State
  const [bulkFormData, setBulkFormData] = useState({
    model: '',
    year: new Date().getFullYear(),
    color: '',
    type: 'scooter' as 'scooter' | 'motorcycle',
    batteryCapacity: 2.5,
    maxRange: 80,
    pricePerDay: 150000,
    depositPercentage: 50,
    quantity: 1
  });
  
  const [bulkResult, setBulkResult] = useState<BulkCreateResponse | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form function
  const resetForm = useCallback(() => {
    setBulkFormData({
      model: '',
      year: new Date().getFullYear(),
      color: '',
      type: 'scooter' as 'scooter' | 'motorcycle',
      batteryCapacity: 2.5,
      maxRange: 80,
      pricePerDay: 150000,
      depositPercentage: 50,
      quantity: 1
    });
    setBulkResult(null);
    setVehicleImage(null);
    setImagePreview('');
    setErrors({});
    
    // Reset file input element
    const fileInput = document.getElementById('vehicle-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error('File không phải là ảnh hợp lệ');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Ảnh vượt quá dung lượng 5MB');
      return;
    }
    
    setVehicleImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setVehicleImage(null);
    setImagePreview('');
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form using validation utility
    const validation = validateVehicleBulkForm(bulkFormData as VehicleBulkFormData);
    
    if (!validation.isValid) {
      // Convert errors to record format
      const errorsRecord = errorsToRecord(validation.errors);
      setErrors(errorsRecord);
      
      // Scroll to first error
      scrollToFirstError(validation.errors);
      
      // Show first error message
      if (validation.errors.length > 0) {
        showToast.warning(validation.errors[0].message);
      }
      
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    // Parse validated values (all validated, so safe to parse)
    const year = typeof bulkFormData.year === 'number' ? bulkFormData.year : parseInt(String(bulkFormData.year), 10);
    const batteryCapacity = typeof bulkFormData.batteryCapacity === 'number' 
      ? bulkFormData.batteryCapacity 
      : parseFloat(String(bulkFormData.batteryCapacity));
    const maxRange = typeof bulkFormData.maxRange === 'number' 
      ? bulkFormData.maxRange 
      : parseInt(String(bulkFormData.maxRange), 10);
    const pricePerDay = typeof bulkFormData.pricePerDay === 'number' 
      ? bulkFormData.pricePerDay 
      : parseInt(String(bulkFormData.pricePerDay), 10);
    const depositPercentage = typeof bulkFormData.depositPercentage === 'number' 
      ? bulkFormData.depositPercentage 
      : parseInt(String(bulkFormData.depositPercentage), 10);
    const quantity = typeof bulkFormData.quantity === 'number' 
      ? bulkFormData.quantity 
      : parseInt(String(bulkFormData.quantity), 10);

    // Create the request body matching the API specification
    const requestBody = {
      model: bulkFormData.model.trim(),
      year: year,
      color: bulkFormData.color.trim(),
      type: bulkFormData.type as 'scooter' | 'motorcycle',
      battery_capacity: batteryCapacity,
      max_range: maxRange,
      current_battery: 100,
      price_per_day: pricePerDay,
      deposit_percentage: depositPercentage,
      quantity: quantity,
      export_excel: true,
      images: vehicleImage ? [vehicleImage] : []
    };


    try {
      setLoading(true);
      
      const excelBlob = await vehicleService.bulkCreateVehicles(requestBody);
      
      // Download the Excel file
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Tạo tên file bao gồm model, name và màu xe
      const sanitizedModel = bulkFormData.model.replace(/[/\\?%*:|"<>]/g, '-');
      const sanitizedColor = bulkFormData.color.replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = quantity === 1
        ? `${sanitizedModel}_${sanitizedColor}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `${sanitizedModel}_${sanitizedColor}_${quantity}-xe_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setBulkResult({
        created: [],
        failed: [],
        totalCreated: quantity as number,
        totalFailed: 0
      });
      
      // Notify and close
      showToast.success(`Đã tạo thành công ${quantity} xe!`);
      
      // Reset form after success
      resetForm();
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setBulkResult({
        created: [],
        failed: [{ 
          data: {
            name: 'Error',
            license_plate: 'Error',
            brand: '',
            model: bulkFormData.model || '',
            year: (bulkFormData.year === '' ? new Date().getFullYear() : bulkFormData.year) as number,
            color: bulkFormData.color || '',
            type: (bulkFormData.type || 'scooter') as 'scooter' | 'motorcycle',
            battery_capacity: (bulkFormData.batteryCapacity === '' ? 2.5 : bulkFormData.batteryCapacity) as number,
            max_range: (bulkFormData.maxRange === '' ? 80 : bulkFormData.maxRange) as number,
            price_per_day: (bulkFormData.pricePerDay === '' ? 150000 : bulkFormData.pricePerDay) as number,
            deposit_percentage: (bulkFormData.depositPercentage === '' ? 50 : bulkFormData.depositPercentage) as number
          }, 
          error: error.message || 'Unknown error' 
        }],
        totalCreated: 0,
        totalFailed: 1
      });
      showToast.error(error.message || 'Không thể tạo xe');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      // Reset all form data when closing
      resetForm();
      onClose();
    }
  }, [loading, resetForm, onClose]);

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
            onClick={handleClose}
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
              {/* Header with gradient - Matching CreateStationModal */}
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Tạo xe hàng loạt
                      </h2>
                      <p className="text-green-100 text-sm mt-1">
                        Tạo nhiều xe cùng lúc với thông tin giống nhau
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
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
                <form onSubmit={handleBulkCreate} className="space-y-6" id="bulk-create-form">
                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Quy trình tạo xe hàng loạt
                        </h4>
                        <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
                          <li className="flex items-start">
                            <span className="font-medium mr-2">1.</span>
                            <span>Điền thông tin xe bên dưới</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">2.</span>
                            <span>Nhập số lượng xe cần tạo</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">3.</span>
                            <span>Nhấn "Tạo xe" để tạo và tải file Excel</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">4.</span>
                            <span>Điền biển số vào file Excel</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">5.</span>
                            <span>Dùng "Export/Import Biển số" để cập nhật</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin xe */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <FaMotorcycle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Thông tin xe</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Model */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Model <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-model"
                            name="model"
                            type="text"
                            value={bulkFormData.model}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, model: e.target.value });
                              if (errors.model) {
                                setErrors(prev => ({ ...prev, model: '' }));
                              }
                            }}
                            placeholder="VD: Klara S, VF8"
                            className={`h-11 ${errors.model ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          {errors.model && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.model}
                            </p>
                          )}
                        </div>

                        {/* Năm sản xuất */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Năm sản xuất <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-year"
                            name="year"
                            type="number"
                            min="2000"
                            max="2030"
                            value={bulkFormData.year}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, year: e.target.value === '' ? '' : parseInt(e.target.value) });
                              if (errors.year) {
                                setErrors(prev => ({ ...prev, year: '' }));
                              }
                            }}
                            placeholder="VD: 2024"
                            className={`h-11 ${errors.year ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          {errors.year && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.year}
                            </p>
                          )}
                        </div>

                        {/* Quãng đường tối đa */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Quãng đường tối đa (km) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-maxRange"
                            name="maxRange"
                            type="number"
                            min="50"
                            max="200"
                            value={bulkFormData.maxRange}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, maxRange: e.target.value === '' ? '' : parseInt(e.target.value) });
                              if (errors.maxRange) {
                                setErrors(prev => ({ ...prev, maxRange: '' }));
                              }
                            }}
                            placeholder="VD: 80"
                            className={`h-11 ${errors.maxRange ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          {errors.maxRange && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.maxRange}
                            </p>
                          )}
                        </div>

                        {/* Dung lượng pin */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Dung lượng pin (kWh) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-batteryCapacity"
                            name="batteryCapacity"
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            value={bulkFormData.batteryCapacity}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, batteryCapacity: e.target.value === '' ? '' : parseFloat(e.target.value) });
                              if (errors.batteryCapacity) {
                                setErrors(prev => ({ ...prev, batteryCapacity: '' }));
                              }
                            }}
                            placeholder="VD: 2.5"
                            className={`h-11 ${errors.batteryCapacity ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          {errors.batteryCapacity && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.batteryCapacity}
                            </p>
                          )}
                        </div>

                        {/* Loại xe */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Loại xe <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="field-type"
                            name="type"
                            value={bulkFormData.type}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, type: e.target.value as 'scooter' | 'motorcycle' | '' });
                              if (errors.type) {
                                setErrors(prev => ({ ...prev, type: '' }));
                              }
                            }}
                            className={`w-full h-11 px-4 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                              errors.type ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            required
                            title="Chọn loại xe"
                            aria-label="Loại xe"
                          >
                            <option value="">-- Chọn loại xe --</option>
                            <option value="scooter">Xe máy điện</option>
                            <option value="motorcycle">Mô tô điện</option>
                          </select>
                          {errors.type && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.type}
                            </p>
                          )}
                        </div>

                        {/* Số lượng xe */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Số lượng xe <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-quantity"
                            name="quantity"
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={bulkFormData.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              setBulkFormData({ ...bulkFormData, quantity: value === '' ? '' : Math.max(1, Math.min(100, parseInt(value, 10) || 1)) });
                              if (errors.quantity) {
                                setErrors(prev => ({ ...prev, quantity: '' }));
                              }
                            }}
                            placeholder="VD: 10"
                            className={`h-11 ${errors.quantity ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            Tối đa 100 xe mỗi lần {bulkFormData.quantity !== '' && `(đang chọn: ${bulkFormData.quantity} xe)`}
                          </p>
                          {errors.quantity && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.quantity}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Màu sắc - Full width */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Màu sắc <span className="text-red-500">*</span>
                        </label>
                        <div id="field-color">
                          <ColorPicker
                            value={bulkFormData.color}
                            onChange={(color) => {
                              setBulkFormData({ ...bulkFormData, color });
                              if (errors.color) {
                                setErrors(prev => ({ ...prev, color: '' }));
                              }
                            }}
                          />
                        </div>
                        {errors.color && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.color}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hình ảnh xe */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span>Hình ảnh xe</span>
                        <span className="text-xs text-gray-500 font-normal ml-2">(Tùy chọn, chỉ 1 ảnh)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* Image Upload Button */}
                      <div>
                        <label htmlFor="vehicle-image" className="cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-center">
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">Click để chọn ảnh xe</span> hoặc kéo thả vào đây
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, JPEG, WEBP (tối đa 5MB)
                            </p>
                          </div>
                        </label>
                        <input
                          id="vehicle-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>

                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative group w-full max-w-xs mx-auto">
                          <img
                            src={imagePreview}
                            alt="Vehicle preview"
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa ảnh"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {imagePreview && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 mr-1.5 text-purple-600" />
                          Đã chọn ảnh xe
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Giá cả */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                        <span>Giá cả</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Giá thuê */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Giá thuê (VNĐ/ngày) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-pricePerDay"
                            name="pricePerDay"
                            type="number"
                            min="50000"
                            max="500000"
                            step="1000"
                            value={bulkFormData.pricePerDay}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, pricePerDay: e.target.value === '' ? '' : parseInt(e.target.value) });
                              if (errors.pricePerDay) {
                                setErrors(prev => ({ ...prev, pricePerDay: '' }));
                              }
                            }}
                            placeholder="VD: 150000"
                            className={`h-11 ${errors.pricePerDay ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            {bulkFormData.pricePerDay !== '' ? `${Number(bulkFormData.pricePerDay).toLocaleString('vi-VN')} VNĐ` : 'Nhập giá thuê'}
                          </p>
                          {errors.pricePerDay && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.pricePerDay}
                            </p>
                          )}
                        </div>

                        {/* Phần trăm cọc */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phần trăm cọc (%) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="field-depositPercentage"
                            name="depositPercentage"
                            type="number"
                            min="10"
                            max="100"
                            value={bulkFormData.depositPercentage}
                            onChange={(e) => {
                              setBulkFormData({ ...bulkFormData, depositPercentage: e.target.value === '' ? '' : parseInt(e.target.value) });
                              if (errors.depositPercentage) {
                                setErrors(prev => ({ ...prev, depositPercentage: '' }));
                              }
                            }}
                            placeholder="VD: 50"
                            className={`h-11 ${errors.depositPercentage ? 'border-red-500 ring-red-500' : ''}`}
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            {bulkFormData.depositPercentage !== '' && bulkFormData.pricePerDay !== '' 
                              ? `Cọc: ${((Number(bulkFormData.pricePerDay) * Number(bulkFormData.depositPercentage)) / 100).toLocaleString('vi-VN')} VNĐ` 
                              : 'Phần trăm tiền cọc'}
                          </p>
                          {errors.depositPercentage && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.depositPercentage}
                            </p>
                          )}
                        </div>
                  </div>
                    </CardContent>
                  </Card>

                  {/* Kết quả */}
                  {bulkResult && (
                    <Card className="border-2 border-gray-200 dark:border-gray-700">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="text-base">
                          Kết quả tạo xe
                        </CardTitle>
                  </CardHeader>
                      <CardContent className="p-6">
                        {bulkResult.totalCreated > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Tạo xe thành công!
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Đã tạo thành công {bulkResult.totalCreated} xe
                                </p>
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <Download className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h5 className="text-sm font-medium text-green-900 dark:text-green-300">
                                    File Excel đã được tải xuống
                                  </h5>
                                  <p className="text-sm text-green-800 dark:text-green-400 mt-1">
                                    File Excel chứa thông tin các xe đã tạo. Điền biển số và dùng "Export/Import Biển số" để cập nhật.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Có lỗi xảy ra
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Không thể tạo xe
                                </p>
                              </div>
                            </div>
                            {bulkResult.failed.length > 0 && (
                              <div className="space-y-2">
                                {bulkResult.failed.map((item, index) => (
                                  <div key={index} className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                                    {item.error}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                  </CardContent>
                </Card>
              )}
                </form>
              </div>

              {/* Fixed Footer - Action Buttons */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    form="bulk-create-form"
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
                        Tạo xe
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

import { useState } from 'react';
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
    
    // Validate quantity - ensure it's a positive integer
    const quantity = parseInt(bulkFormData.quantity.toString(), 10);
    if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
      showToast.warning('Vui lòng nhập số lượng xe hợp lệ (1-100)');
      return;
    }

    // Validate required fields
    if (!bulkFormData.model || !bulkFormData.color) {
      showToast.warning('Vui lòng điền đầy đủ thông tin xe (Model và Màu sắc là bắt buộc)');
      return;
    }

    // Create the request body matching the API specification
    const requestBody = {
      model: bulkFormData.model.trim(),
      year: parseInt(bulkFormData.year.toString(), 10),
      color: bulkFormData.color.trim(),
      type: bulkFormData.type,
      battery_capacity: parseFloat(bulkFormData.batteryCapacity.toString()),
      max_range: parseInt(bulkFormData.maxRange.toString(), 10),
      current_battery: 100,
      price_per_day: parseInt(bulkFormData.pricePerDay.toString(), 10),
      deposit_percentage: parseInt(bulkFormData.depositPercentage.toString(), 10),
      quantity: quantity, // Ensure it's an integer
      export_excel: true,
      images: vehicleImage ? [vehicleImage] : []
    };

    console.log('📝 Bulk create request prepared:', {
      quantity: requestBody.quantity,
      model: requestBody.model,
      color: requestBody.color,
      type: requestBody.type
    });

    try {
      setLoading(true);
      
      const excelBlob = await vehicleService.bulkCreateVehicles(requestBody);
      
      // Download the Excel file
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Tạo tên file bao gồm model, name (model) và màu xe
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
        totalCreated: bulkFormData.quantity,
        totalFailed: 0
      });
      
      // Reset form after success
      setBulkFormData({
        model: '',
        year: new Date().getFullYear(),
        color: '',
        type: 'scooter',
        batteryCapacity: 2.5,
        maxRange: 80,
        pricePerDay: 150000,
        depositPercentage: 50,
        quantity: 1
      });
      setVehicleImage(null);
      setImagePreview('');
      
      // Notify and close
      showToast.success(`Đã tạo thành công ${bulkFormData.quantity} xe!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error bulk creating vehicles:', error);
      setBulkResult({
        created: [],
        failed: [{ 
          data: {
            name: 'Error',
            license_plate: 'Error',
            brand: '',
            model: bulkFormData.model,
            year: bulkFormData.year,
            color: bulkFormData.color,
            type: bulkFormData.type,
            battery_capacity: bulkFormData.batteryCapacity,
            max_range: bulkFormData.maxRange,
            price_per_day: bulkFormData.pricePerDay,
            deposit_percentage: bulkFormData.depositPercentage
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

  const handleClose = () => {
    setBulkResult(null);
    setVehicleImage(null);
    setImagePreview('');
    onClose();
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
                            type="text"
                            value={bulkFormData.model}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, model: e.target.value })}
                            placeholder="VD: Klara S, VF8"
                            className="h-11"
                            required
                          />
                        </div>

                        {/* Năm sản xuất */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Năm sản xuất <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="2000"
                            max="2030"
                            value={bulkFormData.year}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, year: parseInt(e.target.value) })}
                            className="h-11"
                            required
                          />
                        </div>

                        {/* Quãng đường tối đa */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Quãng đường tối đa (km) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="50"
                            max="200"
                            value={bulkFormData.maxRange}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, maxRange: parseInt(e.target.value) })}
                            placeholder="VD: 80"
                            className="h-11"
                            required
                          />
                        </div>

                        {/* Dung lượng pin */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Dung lượng pin (kWh) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            value={bulkFormData.batteryCapacity}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, batteryCapacity: parseFloat(e.target.value) })}
                            className="h-11"
                            required
                          />
                        </div>

                        {/* Loại xe */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Loại xe <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={bulkFormData.type}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, type: e.target.value as 'scooter' | 'motorcycle' })}
                            className="w-full h-11 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            required
                            title="Chọn loại xe"
                            aria-label="Loại xe"
                          >
                            <option value="scooter">Xe máy điện</option>
                            <option value="motorcycle">Mô tô điện</option>
                          </select>
                        </div>

                        {/* Số lượng xe */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Số lượng xe <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={bulkFormData.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = value === '' ? 1 : Math.max(1, Math.min(100, parseInt(value, 10) || 1));
                              setBulkFormData({ ...bulkFormData, quantity: numValue });
                            }}
                            placeholder="VD: 10"
                            className="h-11"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            Tối đa 100 xe mỗi lần (đang chọn: {bulkFormData.quantity} xe)
                          </p>
                        </div>
                      </div>

                      {/* Màu sắc - Full width */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Màu sắc <span className="text-red-500">*</span>
                        </label>
                        <ColorPicker
                          value={bulkFormData.color}
                          onChange={(color) => setBulkFormData({ ...bulkFormData, color })}
                        />
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
                            type="number"
                            min="50000"
                            max="500000"
                            step="1000"
                            value={bulkFormData.pricePerDay}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, pricePerDay: parseInt(e.target.value) })}
                            placeholder="VD: 150000"
                            className="h-11"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            {bulkFormData.pricePerDay ? `${bulkFormData.pricePerDay.toLocaleString('vi-VN')} VNĐ` : 'Nhập giá thuê'}
                          </p>
                        </div>

                        {/* Phần trăm cọc */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phần trăm cọc (%) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="10"
                            max="100"
                            value={bulkFormData.depositPercentage}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, depositPercentage: parseInt(e.target.value) })}
                            placeholder="VD: 50"
                            className="h-11"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            {bulkFormData.depositPercentage && bulkFormData.pricePerDay 
                              ? `Cọc: ${((bulkFormData.pricePerDay * bulkFormData.depositPercentage) / 100).toLocaleString('vi-VN')} VNĐ` 
                              : 'Phần trăm tiền cọc'}
                          </p>
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

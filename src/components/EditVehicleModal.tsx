import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Zap, DollarSign, MapPin, RefreshCw, Edit } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { vehicleService } from './service/vehicleService';
import { stationService } from './service/stationService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';
import type { VehicleUI, UpdateVehicleRequest, VehicleStatus, VehicleType } from './service/type/vehicleTypes';
import type { Station } from './service/type/stationTypes';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleUI | null;
  onVehicleUpdated: () => void;
}

export function EditVehicleModal({ isOpen, onClose, vehicle, onVehicleUpdated }: EditVehicleModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    type: 'scooter' as VehicleType,
    batteryCapacity: 2.5,
    maxRange: 80,
    batteryLevel: 100,
    pricePerDay: 150000,
    depositPercentage: 50,
    status: 'available' as VehicleStatus,
    stationId: '',
    isActive: true
  });

  // Load form data when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        licensePlate: vehicle.licensePlate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        type: vehicle.type || 'scooter',
        batteryCapacity: vehicle.batteryCapacity || 2.5,
        maxRange: vehicle.maxRange || 80,
        batteryLevel: vehicle.batteryLevel || 100,
        pricePerDay: vehicle.pricePerDay || 150000,
        depositPercentage: vehicle.depositPercentage || 50,
        status: vehicle.status || 'available',
        stationId: vehicle.stationId || '',
        isActive: vehicle.isActive !== false
      });
      setErrors({});
    }
  }, [vehicle]);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStations();
      loadModels();
      loadBrands();
    }
  }, [isOpen]);

  const loadStations = async () => {
    try {
      const response = await stationService.getStations({ page: 1, limit: 999 });
      console.log('🏢 EditVehicleModal - Loaded stations:', response.stations?.length || 0);
      setStations(response.stations || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    }
  };

  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const response = await vehicleService.getVehicleModels();
      setModels(response.data || []);
    } catch (error) {
      console.error('Error loading vehicle models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await vehicleService.getVehicleBrands();
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error loading vehicle brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tên xe là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên xe phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên xe không được quá 100 ký tự';
    }

    // License plate validation with Vietnamese format
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Biển số là bắt buộc';
    } else {
      // Format: 54P-354.13 or 54P-35413 (with or without dot)
      // Vietnamese license plate format: [2 digits][Letter][dash][3-5 digits][optional dot][optional 2 digits]
      const licensePlateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,6}(\.[0-9]{2})?$/;
      const normalizedPlate = formData.licensePlate.trim().toUpperCase();
      
      if (!licensePlateRegex.test(normalizedPlate)) {
        newErrors.licensePlate = 'Biển số không đúng định dạng (VD: 54P-354.13 hoặc 89K-942.32)';
        console.log('License plate validation failed:', normalizedPlate);
      }
    }

    // Brand validation
    if (!formData.brand.trim()) {
      newErrors.brand = 'Thương hiệu là bắt buộc';
    } else if (formData.brand.trim().length < 2) {
      newErrors.brand = 'Thương hiệu phải có ít nhất 2 ký tự';
    }

    // Model validation
    if (!formData.model.trim()) {
      newErrors.model = 'Model là bắt buộc';
    } else if (formData.model.trim().length < 2) {
      newErrors.model = 'Model phải có ít nhất 2 ký tự';
    }

    // Color validation
    if (!formData.color.trim()) {
      newErrors.color = 'Màu sắc là bắt buộc';
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (formData.year < 2000) {
      newErrors.year = 'Năm sản xuất phải từ 2000 trở lên';
    } else if (formData.year > currentYear + 1) {
      newErrors.year = `Năm sản xuất không được vượt quá ${currentYear + 1}`;
    }

    // Battery capacity validation
    if (formData.batteryCapacity <= 0) {
      newErrors.batteryCapacity = 'Dung lượng pin phải lớn hơn 0';
    } else if (formData.batteryCapacity > 100) {
      newErrors.batteryCapacity = 'Dung lượng pin không hợp lý (tối đa 100 kWh)';
    }

    // Max range validation
    if (formData.maxRange <= 0) {
      newErrors.maxRange = 'Quãng đường tối đa phải lớn hơn 0';
    } else if (formData.maxRange > 500) {
      newErrors.maxRange = 'Quãng đường tối đa không hợp lý (tối đa 500 km)';
    }

    // Battery level validation
    if (formData.batteryLevel < 0 || formData.batteryLevel > 100) {
      newErrors.batteryLevel = 'Mức pin phải từ 0-100%';
    }

    // Price validation
    if (formData.pricePerDay <= 0) {
      newErrors.pricePerDay = 'Giá thuê phải lớn hơn 0';
    } else if (formData.pricePerDay < 10000) {
      newErrors.pricePerDay = 'Giá thuê tối thiểu là 10,000 VNĐ';
    } else if (formData.pricePerDay > 10000000) {
      newErrors.pricePerDay = 'Giá thuê tối đa là 10,000,000 VNĐ';
    }

    // Deposit percentage validation
    if (formData.depositPercentage < 0 || formData.depositPercentage > 100) {
      newErrors.depositPercentage = 'Phần trăm cọc phải từ 0-100%';
    }

    // Station validation - Optional for edit, required for create
    // Allow empty station during edit
    // if (!formData.stationId) {
    //   newErrors.stationId = 'Vui lòng chọn trạm xe';
    // }

    setErrors(newErrors);
    
    // Log errors for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      const updateData: UpdateVehicleRequest = {
        name: formData.name,
        license_plate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        type: formData.type,
        battery_capacity: formData.batteryCapacity,
        max_range: formData.maxRange,
        price_per_day: formData.pricePerDay,
        deposit_percentage: formData.depositPercentage,
        station_id: formData.stationId || undefined,
        isActive: formData.isActive
      };

      await vehicleService.updateVehicle(vehicle.id, updateData);
      
      // Update battery level separately if changed
      if (formData.batteryLevel !== vehicle.batteryLevel) {
        await vehicleService.updateVehicleBattery(vehicle.id, { current_battery: formData.batteryLevel });
      }

      showToast.success('Cập nhật thông tin xe thành công!');
      onVehicleUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật xe';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
          {/* Header with gradient - Fixed */}
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6 flex-shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Chỉnh sửa thông tin xe
                  </h2>
                  <p className="text-sm text-blue-100 mt-1 font-medium">
                    {vehicle?.licensePlate} • {vehicle?.brand} {vehicle?.model}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
                className="text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        
        <div className="max-h-[calc(90vh-100px)] overflow-y-auto">

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Basic Information */}
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaMotorcycle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Thông tin cơ bản</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tên xe <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                    required
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
                    Biển số <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.licensePlate}
                    onChange={(e) => {
                      // Auto format to uppercase
                      const value = e.target.value.toUpperCase();
                      setFormData({ ...formData, licensePlate: value });
                    }}
                    placeholder="VD: 51F-512.13 hoặc 89K-942.32"
                    className={errors.licensePlate ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                  />
                  {errors.licensePlate ? (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.licensePlate}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">
                      Định dạng: [Số tỉnh][Chữ cái]-[Số].[Số] (VD: 51F-512.13)
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu *
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    disabled={loadingBrands}
                    aria-label="Chọn thương hiệu xe"
                  >
                    <option value="">
                      {loadingBrands ? 'Đang tải...' : 'Chọn thương hiệu'}
                    </option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  {errors.brand ? (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.brand}
                    </p>
                  ) : brands.length === 0 && !loadingBrands ? (
                    <p className="text-xs text-gray-500 mt-1">
                      Không có thương hiệu nào trong hệ thống
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.model ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    disabled={loadingModels}
                    aria-label="Chọn model xe"
                  >
                    <option value="">
                      {loadingModels ? 'Đang tải...' : 'Chọn model'}
                    </option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {errors.model ? (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.model}
                    </p>
                  ) : models.length === 0 && !loadingModels ? (
                    <p className="text-xs text-gray-500 mt-1">
                      Không có model nào trong hệ thống
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm sản xuất *
                  </label>
                  <Input
                    type="number"
                    min="2000"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className={errors.year ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                  />
                  {errors.year && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.year}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc *
                  </label>
                  <ColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                  {errors.color && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.color}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại xe *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="Chọn loại xe"
                >
                  <option value="scooter">Xe máy điện</option>
                  <option value="motorcycle">Mô tô điện</option>
                </select>
              </div>
            </CardContent>
          </Card>

            {/* Technical Specifications */}
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Thông số kỹ thuật</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dung lượng pin (kWh) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={formData.batteryCapacity}
                    onChange={(e) => setFormData({ ...formData, batteryCapacity: parseFloat(e.target.value) })}
                    className={errors.batteryCapacity ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                  />
                  {errors.batteryCapacity && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.batteryCapacity}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quãng đường tối đa (km) *
                  </label>
                  <Input
                    type="number"
                    min="50"
                    max="200"
                    value={formData.maxRange}
                    onChange={(e) => setFormData({ ...formData, maxRange: parseInt(e.target.value) })}
                    className={errors.maxRange ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                  />
                  {errors.maxRange && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.maxRange}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức pin hiện tại (%) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryLevel}
                  onChange={(e) => setFormData({ ...formData, batteryLevel: parseInt(e.target.value) })}
                  className={errors.batteryLevel ? 'border-red-500 focus:ring-red-500' : ''}
                  required
                />
                {errors.batteryLevel && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.batteryLevel}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Pricing */}
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Giá thuê</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá thuê (VNĐ/ngày) *
                  </label>
                  <Input
                    type="number"
                    min="50000"
                    max="500000"
                    step="1000"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: parseInt(e.target.value) })}
                    className={errors.pricePerDay ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                  />
                  {errors.pricePerDay && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.pricePerDay}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phần trăm cọc (%) *
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.depositPercentage}
                    onChange={(e) => setFormData({ ...formData, depositPercentage: parseInt(e.target.value) })}
                    className={errors.depositPercentage ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                  />
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

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t-2 border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900 -mx-6 px-6 py-4 rounded-b-2xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="px-6 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all font-medium"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Cập nhật xe
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
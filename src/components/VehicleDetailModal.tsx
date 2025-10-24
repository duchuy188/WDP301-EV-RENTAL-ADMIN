import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, Zap, DollarSign, MapPin, Eye, ChevronLeft, ChevronRight, ZoomIn, Hash, Palette, Factory, CalendarDays, Route, CreditCard, Percent, Building2, Power, Wrench, User, Clock, Gauge } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BatteryIndicator } from './ui/battery-indicator';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';
import { formatDate } from '../utils/dateUtils';
import { formatVehicleStatus, getVehicleStatusColor } from './service/utils/apiUtils';
import type { VehicleUI } from './service/type/vehicleTypes';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleUI | null;
  onEdit?: (vehicle: VehicleUI) => void;
}

export function VehicleDetailModal({ isOpen, onClose, vehicle, onEdit }: VehicleDetailModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Reset image index when vehicle changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsImageZoomed(false);
  }, [vehicle?.id]);

  if (!isOpen || !vehicle) return null;

  const handleEdit = () => {
    if (onEdit && vehicle) {
      onEdit(vehicle);
      onClose();
    }
  };

  // Image gallery handlers
  const hasMultipleImages = vehicle.images && vehicle.images.length > 1;
  const currentImage = vehicle.images?.[currentImageIndex];

  const handlePrevImage = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.images!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient - Fixed */}
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {vehicle.licensePlate}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1 font-medium">
                        {vehicle.brand} {vehicle.model} • {vehicle.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getVehicleStatusColor(vehicle.status)} px-4 py-2 text-sm font-semibold`}>
                      {formatVehicleStatus(vehicle.status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full"
                      title="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* Left Sidebar - Image & Quick Info */}
                  <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                    {/* Vehicle Image Gallery */}
                    <div className="sticky top-0">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <div>
                          {/* Main Image Display */}
                          <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 group">
                            <img
                              src={currentImage}
                              alt={`${vehicle.licensePlate} - Image ${currentImageIndex + 1}`}
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => setIsImageZoomed(true)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-gray-500 mt-2">Ảnh không khả dụng</p></div></div>';
                                }
                              }}
                            />
                            
                            {/* Image Counter */}
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                              {currentImageIndex + 1}/{vehicle.images.length}
                            </div>

                            {/* Zoom Icon Hint */}
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg">
                                <ZoomIn className="h-4 w-4" />
                              </div>
                            </div>

                            {/* Navigation Arrows */}
                            {hasMultipleImages && (
                              <>
                                <button
                                  onClick={handlePrevImage}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                  aria-label="Previous image"
                                  title="Ảnh trước"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={handleNextImage}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                  aria-label="Next image"
                                  title="Ảnh tiếp theo"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Navigation */}
                          {hasMultipleImages && (
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                                {vehicle.images.map((image, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleThumbnailClick(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                      index === currentImageIndex
                                        ? 'border-blue-600 ring-2 ring-blue-300'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                                  >
                                    <img
                                      src={image}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-72 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                              <Car className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Chưa có hình ảnh</p>
                          </div>
                        </div>
                      )}

                      {/* Quick Info Cards */}
                      <div className="p-4 space-y-3">
                        {/* Battery */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-green-500 rounded-lg">
                                <Zap className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">Pin</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {vehicle.batteryLevel}%
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-amber-500 rounded-lg">
                                <DollarSign className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Giá thuê</span>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 ml-10">
                            {vehicle.pricePerDay.toLocaleString('vi-VN')}
                            <span className="text-sm font-normal"> VNĐ/ngày</span>
                          </p>
                        </div>

                        {/* Range */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                <Route className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Tầm xa</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {vehicle.maxRange} km
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                              <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vị trí</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {vehicle.stationName || 'Chưa phân bổ'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Active Status */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Power className={`h-4 w-4 ${vehicle.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoạt động</span>
                            </div>
                            <Badge className={vehicle.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                              {vehicle.isActive ? '✓ Active' : '✕ Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Content - Details */}
                  <div className="lg:col-span-2 p-6 space-y-6">
                    {/* Vehicle Information */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <div className="h-1 w-1 bg-blue-600 rounded-full mr-2"></div>
                        Thông tin xe
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon={<Hash className="h-4 w-4" />} label="Tên xe" value={vehicle.name} color="blue" />
                        <InfoItem icon={<Hash className="h-4 w-4" />} label="Biển số" value={vehicle.licensePlate} color="green" />
                        <InfoItem icon={<Factory className="h-4 w-4" />} label="Hãng" value={vehicle.brand} color="purple" />
                        <InfoItem icon={<Car className="h-4 w-4" />} label="Model" value={vehicle.model} color="indigo" />
                        <InfoItem icon={<CalendarDays className="h-4 w-4" />} label="Năm SX" value={vehicle.year.toString()} color="orange" />
                        <InfoItem 
                          icon={<Palette className="h-4 w-4" />} 
                          label="Màu sắc" 
                          value={
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"
                                style={{ backgroundColor: vehicle.color }}
                              />
                              <span>{vehicle.color}</span>
                            </div>
                          } 
                          color="pink" 
                        />
                      </div>
                    </div>

                    {/* Technical Specs */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <div className="h-1 w-1 bg-green-600 rounded-full mr-2"></div>
                        Thông số kỹ thuật
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem 
                          icon={<Zap className="h-4 w-4" />} 
                          label="Dung lượng pin" 
                          value={`${vehicle.batteryCapacity} kWh`} 
                          color="green" 
                        />
                        <InfoItem 
                          icon={<Route className="h-4 w-4" />} 
                          label="Tầm xa tối đa" 
                          value={`${vehicle.maxRange} km`} 
                          color="blue" 
                        />
                        <InfoItem 
                          icon={<Car className="h-4 w-4" />} 
                          label="Loại xe" 
                          value={vehicle.type === 'scooter' ? '🛵 Xe máy điện' : '🏍️ Mô tô điện'} 
                          color="indigo" 
                        />
                        {vehicle.currentMileage !== undefined && (
                          <InfoItem 
                            icon={<Gauge className="h-4 w-4" />} 
                            label="Quãng đường đã đi" 
                            value={`${vehicle.currentMileage.toLocaleString('vi-VN')} km`} 
                            color="orange" 
                          />
                        )}
                      </div>

                      {/* Battery Indicator - Full Width */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium flex items-center">
                          <Gauge className="h-3 w-3 mr-1" />
                          Mức pin hiện tại
                        </p>
                        <BatteryIndicator level={vehicle.batteryLevel} />
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <div className="h-1 w-1 bg-amber-600 rounded-full mr-2"></div>
                        Thông tin giá
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Daily Rate */}
                        <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 font-medium flex items-center">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Giá thuê/ngày
                              </p>
                              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                {(vehicle.pricePerDay / 1000).toFixed(0)}k
                              </p>
                              <p className="text-xs text-amber-500 mt-0.5">VNĐ</p>
                            </div>
                            <div className="p-2.5 bg-amber-500 rounded-lg">
                              <DollarSign className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Deposit */}
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium flex items-center">
                                <Percent className="h-3 w-3 mr-1" />
                                Tiền cọc ({vehicle.depositPercentage}%)
                              </p>
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {((vehicle.pricePerDay * vehicle.depositPercentage) / 100 / 1000).toFixed(0)}k
                              </p>
                              <p className="text-xs text-blue-500 mt-0.5">VNĐ</p>
                            </div>
                            <div className="p-2.5 bg-blue-500 rounded-lg">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <div className="h-1 w-1 bg-gray-600 rounded-full mr-2"></div>
                        Thông tin khác
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {vehicle.technicalStatus && (
                          <InfoItem 
                            icon={<Wrench className="h-4 w-4" />} 
                            label="Tình trạng kỹ thuật" 
                            value={vehicle.technicalStatus === 'good' ? '✓ Tốt' : vehicle.technicalStatus === 'fair' ? '○ Trung bình' : '⚠ Cần kiểm tra'} 
                            color="blue" 
                          />
                        )}
                        {vehicle.createdBy && (
                          <InfoItem 
                            icon={<User className="h-4 w-4" />} 
                            label="Người tạo" 
                            value={vehicle.createdBy} 
                            color="purple" 
                          />
                        )}
                        <InfoItem 
                          icon={<Clock className="h-4 w-4" />} 
                          label="Ngày tạo" 
                          value={formatDate(vehicle.createdAt)} 
                          color="gray" 
                        />
                        <InfoItem 
                          icon={<Clock className="h-4 w-4" />} 
                          label="Cập nhật" 
                          value={formatDate(vehicle.updatedAt)} 
                          color="gray" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer - Action Buttons */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Đóng
                  </Button>
                  {onEdit && (
                    <Button
                      type="button"
                      onClick={handleEdit}
                      className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Car className="h-5 w-5 mr-2" />
                      Chỉnh sửa xe
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Fullscreen Image Modal */}
          <AnimatePresence>
            {isImageZoomed && currentImage && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[20000] bg-black/95 backdrop-blur-sm"
                  onClick={() => setIsImageZoomed(false)}
                />
                <div className="fixed inset-0 z-[20001] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative max-w-7xl max-h-[90vh] w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => setIsImageZoomed(false)}
                      className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm transition-colors z-10"
                      aria-label="Close fullscreen"
                    >
                      <X className="h-6 w-6" />
                    </button>

                    {/* Image Info */}
                    <div className="absolute -top-12 left-0 bg-white/10 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                      <p className="text-sm font-medium">
                        {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs opacity-80">
                        Ảnh {currentImageIndex + 1} / {vehicle.images?.length || 1}
                      </p>
                    </div>

                    {/* Fullscreen Image */}
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <img
                        src={currentImage}
                        alt={`${vehicle.licensePlate} - Fullscreen`}
                        className="w-full h-full max-h-[90vh] object-contain"
                      />

                      {/* Navigation in Fullscreen */}
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-8 w-8" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-8 w-8" />
                          </button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {vehicle.images?.length || 1}
                      </div>
                    </div>

                    {/* Thumbnail Strip in Fullscreen */}
                    {hasMultipleImages && (
                      <div className="mt-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                          {vehicle.images?.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex
                                  ? 'border-white ring-2 ring-white/50 scale-110'
                                  : 'border-white/30 hover:border-white/60 hover:scale-105'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// Reusable Info Item Component
interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'orange' | 'pink' | 'gray';
}

function InfoItem({ icon, label, value, color }: InfoItemProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className={`p-2 ${colorClasses[color]} rounded-lg flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

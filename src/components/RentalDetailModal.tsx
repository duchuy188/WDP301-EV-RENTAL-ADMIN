import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Car,
  User,
  Calendar,
  Clock,
  Battery,
  Gauge,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  RefreshCw,
  FileText,
  Package
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Rental, RentalStatus } from './service/type/rentalTypes';
import RentalService from './service/rentalService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface RentalDetailModalProps {
  rental: Rental | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function RentalDetailModal({ rental: initialRental, isOpen, onClose }: RentalDetailModalProps) {
  useDisableBodyScroll(isOpen);
  const [rental, setRental] = useState<Rental | null>(initialRental);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'condition' | 'images' | 'fees'>('info');

  // Update local rental when prop changes
  useEffect(() => {
    setRental(initialRental);
    setActiveTab('info'); // Reset to first tab
  }, [initialRental, isOpen]);

  // Fetch fresh rental data
  const handleRefreshRental = async () => {
    if (!rental?._id) return;

    try {
      setIsRefreshing(true);
      const response = await RentalService.getRentalById(rental._id);
      setRental(response.data);
      showToast.success('Đã làm mới dữ liệu');
    } catch (error: any) {
      showToast.error(error.message || 'Không thể làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!rental) return null;

  // Helper function to check if value is populated object
  const isPopulated = (value: any): value is { _id: string; [key: string]: any } => {
    return typeof value === 'object' && value !== null && '_id' in value;
  };

  // Get status badge
  const getStatusBadge = (status: RentalStatus) => {
    const statusConfig = {
      active: { 
        label: 'Đang thuê', 
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/30 px-4 py-2',
        icon: Clock 
      },
      pending_payment: { 
        label: 'Chờ thanh toán', 
        className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg shadow-yellow-500/30 px-4 py-2',
        icon: AlertCircle 
      },
      completed: { 
        label: 'Hoàn thành', 
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/30 px-4 py-2',
        icon: CheckCircle 
      }
    };
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`font-semibold ${config.className}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-700 dark:via-emerald-700 dark:to-teal-700 p-6 flex-shrink-0">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                      <Car className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">Chi tiết cho thuê</h2>
                      <p className="text-green-50/90 text-sm md:text-base font-semibold mt-1">Mã: {rental.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshRental}
                      disabled={isRefreshing}
                      className="h-10 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
                      title="Làm mới"
                    >
                      <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                      title="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex flex-wrap gap-3">
                  {getStatusBadge(rental.status)}
                  {rental.is_active && (
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg shadow-emerald-500/30 px-4 py-2 font-semibold">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Đang hoạt động
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 md:px-6 py-3 font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                      activeTab === 'info'
                        ? 'border-green-600 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    📋 Thông tin chung
                  </button>
                  <button
                    onClick={() => setActiveTab('condition')}
                    className={`px-4 md:px-6 py-3 font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                      activeTab === 'condition'
                        ? 'border-green-600 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    🔧 Tình trạng xe
                  </button>
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`px-4 md:px-6 py-3 font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                      activeTab === 'images'
                        ? 'border-green-600 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    📸 Hình ảnh
                  </button>
                  <button
                    onClick={() => setActiveTab('fees')}
                    className={`px-4 md:px-6 py-3 font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                      activeTab === 'fees'
                        ? 'border-green-600 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    💰 Chi phí & Ghi chú
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {/* Tab 1: Thông tin chung */}
                    {activeTab === 'info' && (
                      <div className="space-y-4">
                        {/* Time Info - Compact */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Thời gian</span>
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Bắt đầu</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {rental.actual_start_time ? new Date(rental.actual_start_time).toLocaleString('vi-VN') : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Kết thúc</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {rental.actual_end_time ? new Date(rental.actual_end_time).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 4 Columns Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* User Info */}
                          {isPopulated(rental.user_id) && (
                            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
                              <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-cyan-600" />
                                <h4 className="font-bold text-sm text-cyan-900 dark:text-cyan-100">Khách hàng</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600">Tên:</span> <strong>{rental.user_id.fullname || rental.user_id.full_name}</strong></p>
                                <p className="truncate"><span className="text-gray-600">Email:</span> <strong>{rental.user_id.email}</strong></p>
                                <p><span className="text-gray-600">SĐT:</span> <strong>{rental.user_id.phone || rental.user_id.phone_number}</strong></p>
                              </div>
                            </div>
                          )}

                          {/* Vehicle Info */}
                          {isPopulated(rental.vehicle_id) && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center gap-2 mb-3">
                                <Car className="w-4 h-4 text-purple-600" />
                                <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100">Xe</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600">Tên:</span> <strong>{rental.vehicle_id.name}</strong></p>
                                <p><span className="text-gray-600">Biển số:</span> <strong className="font-mono">{rental.vehicle_id.license_plate}</strong></p>
                                <p><span className="text-gray-600">Model:</span> <strong>{rental.vehicle_id.model}</strong></p>
                              </div>
                            </div>
                          )}

                          {/* Booking Info */}
                          {isPopulated(rental.booking_id) && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-amber-600" />
                                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">Đặt xe</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600">Mã:</span> <strong className="font-mono">{rental.booking_id.code}</strong></p>
                                {(rental.booking_id.total_amount || rental.booking_id.total_price) && (
                                  <p><span className="text-gray-600">Tổng tiền:</span> <strong>{formatCurrency(rental.booking_id.total_amount || rental.booking_id.total_price)}</strong></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Station Info */}
                          {isPopulated(rental.station_id) && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-green-600" />
                                <h4 className="font-bold text-sm text-green-900 dark:text-green-100">Trạm</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600">Tên:</span> <strong>{rental.station_id.name}</strong></p>
                                <p className="line-clamp-2"><span className="text-gray-600">Địa chỉ:</span> <strong>{rental.station_id.address}</strong></p>
                              </div>
                            </div>
                          )}

                          {/* Contract Info */}
                          {isPopulated(rental.contract) && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-rose-600" />
                                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-100">Hợp đồng</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600">Mã:</span> <strong className="font-mono">{rental.contract.code}</strong></p>
                                <p>
                                  <span className="text-gray-600">Trạng thái:</span>
                                  <Badge className={`ml-2 text-xs ${rental.contract.is_signed ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                    {rental.contract.status === 'signed' ? 'Đã ký' : 'Chờ ký'}
                                  </Badge>
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Staff Info */}
                          {(isPopulated(rental.pickup_staff_id) || isPopulated(rental.return_staff_id)) && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                              <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-indigo-600" />
                                <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Nhân viên</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                {isPopulated(rental.pickup_staff_id) && (
                                  <p><span className="text-gray-600">Giao xe:</span> <strong>{rental.pickup_staff_id.fullname}</strong></p>
                                )}
                                {isPopulated(rental.return_staff_id) && (
                                  <p><span className="text-gray-600">Nhận xe:</span> <strong>{rental.return_staff_id.fullname}</strong></p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Tình trạng xe */}
                    {activeTab === 'condition' && (
                      <div className="space-y-4">
                        {/* Before */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                          <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-100 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Tình trạng xe khi nhận
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <p className="text-xs text-emerald-600 mb-1">Số km</p>
                              <div className="flex items-center gap-1">
                                <Gauge className="w-4 h-4" />
                                <p className="font-bold">{rental.vehicle_condition_before.mileage} km</p>
                              </div>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <p className="text-xs text-emerald-600 mb-1">Pin</p>
                              <div className="flex items-center gap-1">
                                <Battery className="w-4 h-4 text-green-500" />
                                <p className="font-bold">{rental.vehicle_condition_before.battery_level}%</p>
                              </div>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <p className="text-xs text-emerald-600 mb-1">Ngoại thất</p>
                              <p className="font-bold">{rental.vehicle_condition_before.exterior_condition}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <p className="text-xs text-emerald-600 mb-1">Nội thất</p>
                              <p className="font-bold">{rental.vehicle_condition_before.interior_condition}</p>
                            </div>
                          </div>
                          {rental.vehicle_condition_before.notes && (
                            <div className="mt-3 pt-3 border-t border-emerald-200">
                              <p className="text-xs font-semibold text-emerald-700 mb-1">Ghi chú</p>
                              <p className="text-sm bg-white/40 dark:bg-gray-800/40 rounded p-2">{rental.vehicle_condition_before.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* After */}
                        {rental.vehicle_condition_after && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <h3 className="text-base font-bold text-blue-800 dark:text-blue-100 mb-4 flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              Tình trạng xe khi trả
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <p className="text-xs text-blue-600 mb-1">Số km</p>
                                <div className="flex items-center gap-1">
                                  <Gauge className="w-4 h-4" />
                                  <p className="font-bold">{rental.vehicle_condition_after.mileage} km</p>
                                </div>
                              </div>
                              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <p className="text-xs text-blue-600 mb-1">Pin</p>
                                <div className="flex items-center gap-1">
                                  <Battery className="w-4 h-4 text-green-500" />
                                  <p className="font-bold">{rental.vehicle_condition_after.battery_level}%</p>
                                </div>
                              </div>
                              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <p className="text-xs text-blue-600 mb-1">Ngoại thất</p>
                                <p className="font-bold">{rental.vehicle_condition_after.exterior_condition}</p>
                              </div>
                              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <p className="text-xs text-blue-600 mb-1">Nội thất</p>
                                <p className="font-bold">{rental.vehicle_condition_after.interior_condition}</p>
                              </div>
                            </div>
                            {rental.vehicle_condition_after.notes && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs font-semibold text-blue-700 mb-1">Ghi chú</p>
                                <p className="text-sm bg-white/40 dark:bg-gray-800/40 rounded p-2">{rental.vehicle_condition_after.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Hình ảnh */}
                    {activeTab === 'images' && (
                      <div className="space-y-4">
                        {rental.images_before && rental.images_before.length > 0 && (
                          <div>
                            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-purple-600" />
                              Hình ảnh trước ({rental.images_before.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {rental.images_before.map((image, index) => (
                                <a
                                  key={index}
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-square rounded-lg overflow-hidden group border-2 border-purple-200 hover:border-purple-400 transition-all"
                                >
                                  <img src={image} alt={`Ảnh trước ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-semibold">Xem ảnh</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {rental.images_after && rental.images_after.length > 0 && (
                          <div>
                            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-indigo-600" />
                              Hình ảnh sau ({rental.images_after.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {rental.images_after.map((image, index) => (
                                <a
                                  key={index}
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-square rounded-lg overflow-hidden group border-2 border-indigo-200 hover:border-indigo-400 transition-all"
                                >
                                  <img src={image} alt={`Ảnh sau ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-semibold">Xem ảnh</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!rental.images_before || rental.images_before.length === 0) && (!rental.images_after || rental.images_after.length === 0) && (
                          <div className="text-center py-12">
                            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Không có hình ảnh</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Chi phí & Ghi chú */}
                    {activeTab === 'fees' && (
                      <div className="space-y-4">
                        {/* Fees */}
                        {rental.total_fees && rental.total_fees > 0 ? (
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                            <h3 className="text-base font-bold text-orange-800 mb-3 flex items-center gap-2">
                              <DollarSign className="w-5 h-5" />
                              Chi phí phát sinh
                            </h3>
                            <div className="space-y-2">
                              {rental.late_fee && rental.late_fee > 0 && (
                                <div className="flex justify-between bg-white/50 rounded p-2">
                                  <span className="text-sm">Phí trễ:</span>
                                  <span className="font-bold">{formatCurrency(rental.late_fee)}</span>
                                </div>
                              )}
                              {rental.damage_fee && rental.damage_fee > 0 && (
                                <div className="flex justify-between bg-white/50 rounded p-2">
                                  <span className="text-sm">Phí hư hỏng:</span>
                                  <span className="font-bold">{formatCurrency(rental.damage_fee)}</span>
                                </div>
                              )}
                              {rental.other_fees && rental.other_fees > 0 && (
                                <div className="flex justify-between bg-white/50 rounded p-2">
                                  <span className="text-sm">Phí khác:</span>
                                  <span className="font-bold">{formatCurrency(rental.other_fees)}</span>
                                </div>
                              )}
                              <div className="flex justify-between bg-orange-100 dark:bg-orange-900/40 rounded p-3 border-t-2 border-orange-300">
                                <span className="font-bold">Tổng phí:</span>
                                <span className="font-bold text-xl text-orange-600">{formatCurrency(rental.total_fees)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 text-center">
                            <p className="text-gray-500">Không có phí phát sinh</p>
                          </div>
                        )}

                        {/* Notes */}
                        {rental.staff_notes && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200">
                            <h4 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Ghi chú nhân viên
                            </h4>
                            <p className="text-sm bg-white/40 dark:bg-gray-800/40 rounded p-3 whitespace-pre-wrap">{rental.staff_notes}</p>
                          </div>
                        )}

                        {rental.customer_notes && (
                          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 border border-cyan-200">
                            <h4 className="font-bold text-sm text-cyan-800 mb-2 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Ghi chú khách hàng
                            </h4>
                            <p className="text-sm bg-white/40 dark:bg-gray-800/40 rounded p-3 whitespace-pre-wrap">{rental.customer_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 p-4">
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Đóng
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

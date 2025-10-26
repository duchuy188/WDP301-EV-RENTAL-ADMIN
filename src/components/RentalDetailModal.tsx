import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Car,
  User,
  MapPin,
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

export function RentalDetailModal({ rental: initialRental, isOpen, onClose, onUpdate }: RentalDetailModalProps) {
  useDisableBodyScroll(isOpen);
  const [rental, setRental] = useState<Rental | null>(initialRental);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update local rental when prop changes
  useEffect(() => {
    setRental(initialRental);
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

  // Helper function to extract ID
  const extractId = (value: string | { _id: string; [key: string]: any } | undefined): string => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return value._id;
    return String(value);
  };

  // Get status badge
  const getStatusBadge = (status: RentalStatus) => {
    const statusConfig = {
      active: { label: 'Đang thuê', variant: 'default' as const, icon: Clock },
      pending_payment: { label: 'Chờ thanh toán', variant: 'warning' as const, icon: AlertCircle },
      completed: { label: 'Hoàn thành', variant: 'success' as const, icon: CheckCircle }
    };
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="font-medium">
        <Icon className="w-3.5 h-3.5 mr-1.5" />
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Chi tiết Rental</h2>
                      <p className="text-blue-100 text-sm mt-1 font-medium">Mã: {rental.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshRental}
                      disabled={isRefreshing}
                      className="h-9 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                      title="Làm mới"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
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

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex gap-3">
                    {getStatusBadge(rental.status)}
                    {rental.is_active && (
                      <Badge variant="success">Đang hoạt động</Badge>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Thời gian thuê
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bắt đầu</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(rental.actual_start_time).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {rental.actual_end_time && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kết thúc</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(rental.actual_end_time).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Condition Before */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Tình trạng xe khi nhận
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Số km</p>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="font-bold text-green-900 dark:text-green-100">
                            {rental.vehicle_condition_before.mileage} km
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Pin</p>
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="font-bold text-green-900 dark:text-green-100">
                            {rental.vehicle_condition_before.battery_level}%
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Ngoại thất</p>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {rental.vehicle_condition_before.exterior_condition}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Nội thất</p>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {rental.vehicle_condition_before.interior_condition}
                        </p>
                      </div>
                    </div>
                    {rental.vehicle_condition_before.notes && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Ghi chú</p>
                        <p className="text-sm text-green-900 dark:text-green-100">
                          {rental.vehicle_condition_before.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Condition After */}
                  {rental.vehicle_condition_after && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Tình trạng xe khi trả
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Số km</p>
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                              {rental.vehicle_condition_after.mileage} km
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Pin</p>
                          <div className="flex items-center gap-2">
                            <Battery className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                              {rental.vehicle_condition_after.battery_level}%
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Ngoại thất</p>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            {rental.vehicle_condition_after.exterior_condition}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Nội thất</p>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            {rental.vehicle_condition_after.interior_condition}
                          </p>
                        </div>
                      </div>
                      {rental.vehicle_condition_after.notes && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Ghi chú</p>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {rental.vehicle_condition_after.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Images */}
                  {rental.images_before && rental.images_before.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Hình ảnh trước khi thuê ({rental.images_before.length})
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {rental.images_before.map((image, index) => (
                          <a
                            key={index}
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden group"
                          >
                            <img
                              src={image}
                              alt={`Ảnh trước ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Xem ảnh</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {rental.images_after && rental.images_after.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Hình ảnh sau khi trả ({rental.images_after.length})
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {rental.images_after.map((image, index) => (
                          <a
                            key={index}
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden group"
                          >
                            <img
                              src={image}
                              alt={`Ảnh sau ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Xem ảnh</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fees */}
                  {rental.total_fees && rental.total_fees > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                      <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Chi phí phát sinh
                      </h3>
                      <div className="space-y-2">
                        {rental.late_fee && rental.late_fee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700 dark:text-orange-300">Phí trễ:</span>
                            <span className="font-medium text-orange-900 dark:text-orange-100">
                              {formatCurrency(rental.late_fee)}
                            </span>
                          </div>
                        )}
                        {rental.damage_fee && rental.damage_fee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700 dark:text-orange-300">Phí hư hỏng:</span>
                            <span className="font-medium text-orange-900 dark:text-orange-100">
                              {formatCurrency(rental.damage_fee)}
                            </span>
                          </div>
                        )}
                        {rental.other_fees && rental.other_fees > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700 dark:text-orange-300">Phí khác:</span>
                            <span className="font-medium text-orange-900 dark:text-orange-100">
                              {formatCurrency(rental.other_fees)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-orange-200 dark:border-orange-800">
                          <span className="font-semibold text-orange-900 dark:text-orange-100">Tổng phí:</span>
                          <span className="font-bold text-lg text-orange-900 dark:text-orange-100">
                            {formatCurrency(rental.total_fees)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {(rental.staff_notes || rental.customer_notes) && (
                    <div className="space-y-3">
                      {rental.staff_notes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Ghi chú nhân viên:
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">{rental.staff_notes}</p>
                        </div>
                      )}
                      {rental.customer_notes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Ghi chú khách hàng:
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">{rental.customer_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IDs */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Thông tin liên kết
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {rental.booking_id && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Booking ID</p>
                          <p className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                            {extractId(rental.booking_id).substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {rental.user_id && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">User ID</p>
                          <p className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                            {extractId(rental.user_id).substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {rental.vehicle_id && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Vehicle ID</p>
                          <p className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                            {extractId(rental.vehicle_id).substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {rental.station_id && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Station ID</p>
                          <p className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                            {extractId(rental.station_id).substring(0, 12)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">Ngày tạo</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(rental.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">Cập nhật lần cuối</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(rental.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
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
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


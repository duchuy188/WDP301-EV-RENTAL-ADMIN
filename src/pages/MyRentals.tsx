import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Calendar,
  Battery,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Image as ImageIcon,
  Gauge,
  Eye
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import RentalService from '../components/service/rentalService';
import { Rental, GetAdminRentalsParams, RentalStatus } from '../components/service/type/rentalTypes';
import { showToast } from '../lib/toast';
import { RentalDetailModal } from '../components/RentalDetailModal';

export function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<GetAdminRentalsParams>({
    page: 1,
    limit: 10,
  });
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch rentals (Admin)
  const fetchRentals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching admin rentals with filters:', filters);
      
      const response = await RentalService.getAdminRentals(filters);
      
      console.log('📊 API Response:', response);
      
      setRentals(response.data.rentals);
      setPagination(response.data.pagination);
      
      console.log('✅ Rentals state updated:', response.data.rentals.length, 'rentals');
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách rentals';
      setError(errorMessage);
      showToast.error(`Lỗi tải dữ liệu: ${errorMessage}`);
      console.error('❌ Error fetching rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [filters]);

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value === 'all' ? undefined : value as RentalStatus,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    fetchRentals();
    showToast.success('Đã làm mới dữ liệu');
  };

  const handleViewDetail = (rental: Rental) => {
    setSelectedRental(rental);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRental(null);
  };

  const handleUpdate = () => {
    fetchRentals();
  };

  // Get status badge
  const getStatusBadge = (status: RentalStatus) => {
    const statusConfig = {
      active: { label: 'Đang thuê', variant: 'default' as const, icon: Clock },
      pending_payment: { label: 'Chờ thanh toán', variant: 'warning' as const, icon: AlertCircle },
      completed: { label: 'Hoàn thành', variant: 'success' as const, icon: CheckCircle }
    };
    const config = statusConfig[status] || { label: 'Không xác định', variant: 'default' as const, icon: AlertCircle };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl">
                  <Car className="w-7 h-7 text-white" />
                </div>
                Quản lý đặt và thuê xe
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quản lý tất cả các rental trong hệ thống
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bộ lọc</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">⏳ Đang thuê</SelectItem>
                  <SelectItem value="pending_payment">💳 Chờ thanh toán</SelectItem>
                  <SelectItem value="completed">✅ Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Rentals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Lỗi tải dữ liệu
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          ) : rentals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Chưa có lịch sử thuê xe
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Bạn chưa có lần thuê xe nào
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(rentals || []).map((rental) => (
                  <motion.div
                    key={rental._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg mb-2">{rental.code || 'N/A'}</CardTitle>
                            {getStatusBadge(rental.status)}
                          </div>
                          <Car className="w-8 h-8 text-primary-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Time Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Bắt đầu:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {rental.actual_start_time ? new Date(rental.actual_start_time).toLocaleString('vi-VN') : 'N/A'}
                            </span>
                          </div>
                          {rental.actual_end_time && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">Kết thúc:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {rental.actual_end_time ? new Date(rental.actual_end_time).toLocaleString('vi-VN') : 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Vehicle Condition Before */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Tình trạng xe khi nhận
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-gray-400" />
                              <span>{rental.vehicle_condition_before?.mileage || 0} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-green-500" />
                              <span>{rental.vehicle_condition_before?.battery_level || 0}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Condition After */}
                        {rental.vehicle_condition_after && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Tình trạng xe khi trả
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Gauge className="w-3 h-3 text-gray-400" />
                                <span>{rental.vehicle_condition_after?.mileage || 0} km</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Battery className="w-3 h-3 text-green-500" />
                                <span>{rental.vehicle_condition_after?.battery_level || 0}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fees */}
                        {rental.total_fees && rental.total_fees > 0 && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Tổng phí:</span>
                              <span className="font-bold text-primary-600">
                                {formatCurrency(rental.total_fees)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Images */}
                        {((rental.images_before?.length || 0) > 0 || (rental.images_after && (rental.images_after?.length || 0) > 0)) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <ImageIcon className="w-3 h-3" />
                            <span>
                              {rental.images_before?.length || 0} ảnh trước
                              {rental.images_after && `, ${rental.images_after?.length || 0} ảnh sau`}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(rental)}
                            className="w-full hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Trang {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <RentalDetailModal
        rental={selectedRental}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdate}
      />
    </div>
  );
}


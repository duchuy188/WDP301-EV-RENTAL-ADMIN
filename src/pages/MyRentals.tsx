import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Battery,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Gauge,
  Eye,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import RentalService from '../components/service/rentalService';
import { Rental, GetAdminRentalsParams, RentalStatus } from '../components/service/type/rentalTypes';
import { showToast } from '../lib/toast';
import { RentalDetailModal } from '../components/RentalDetailModal';
import { useDebounce } from '../hooks/useDebounce';

export function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<GetAdminRentalsParams>({
    page: 1,
    limit: 12,
  });
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1500);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
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

  // Filter rentals by search term (using debounced value)
  const filteredRentals = rentals.filter((rental) => {
    if (!debouncedSearchTerm) return true;
    const searchLower = debouncedSearchTerm.toLowerCase();
    const userId = typeof rental.user_id === 'object' ? rental.user_id : null;
    return (
      rental.code?.toLowerCase().includes(searchLower) ||
      (userId && 'email' in userId && typeof userId.email === 'string' && userId.email.toLowerCase().includes(searchLower)) ||
      (userId && 'full_name' in userId && typeof userId.full_name === 'string' && userId.full_name.toLowerCase().includes(searchLower))
    );
  });

  // Get status badge
  const getStatusBadge = (status: RentalStatus) => {
    const statusConfig = {
      active: { 
        label: 'Đang thuê', 
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/30',
        icon: Clock 
      },
      pending_payment: { 
        label: 'Chờ thanh toán', 
        className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg shadow-yellow-500/30',
        icon: AlertCircle 
      },
      completed: { 
        label: 'Hoàn thành', 
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/30',
        icon: CheckCircle 
      }
    };
    const config = statusConfig[status] || { 
      label: 'Không xác định', 
      className: 'bg-gray-500 text-white border-0',
      icon: AlertCircle 
    };
    const Icon = config.icon;
    
    return (
      <Badge className={`font-semibold px-3 py-1.5 ${config.className}`}>
        <Icon className="w-4 h-4 mr-1.5" />
        {config.label}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 py-5 px-8 shadow-xl border-0">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg">
                  Quản lý đặt và thuê xe
                </h1>
                <p className="text-green-50 dark:text-green-100">
                  Quản lý tất cả các rental trong hệ thống
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tìm kiếm & Bộ lọc</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo mã rental, email hoặc tên khách hàng..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-12 pr-12 h-12 text-base border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchTerm && debouncedSearchTerm !== searchTerm && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {searchTerm && debouncedSearchTerm === searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      aria-label="Xóa tìm kiếm"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full h-12 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span>Tất cả</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Đang thuê</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Chờ thanh toán</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Hoàn thành</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Results Info */}
          {debouncedSearchTerm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tìm thấy <span className="font-bold text-blue-600 dark:text-blue-400">{filteredRentals.length}</span> kết quả cho "{debouncedSearchTerm}"
              </p>
            </motion.div>
          )}
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
                <FaMotorcycle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
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
                <AnimatePresence mode="popLayout">
                  {(filteredRentals || []).map((rental, index) => (
                    <motion.div
                      key={rental._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      layout
                    >
                      <Card className="group h-full hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden relative flex flex-col">
                        {/* Top Gradient Bar */}
                        <div className={`h-1.5 w-full ${
                          rental.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          rental.status === 'pending_payment' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`} />
                        
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                rental.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                rental.status === 'pending_payment' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-green-100 dark:bg-green-900/30'
                              }`}>
                                <FaMotorcycle className={`w-5 h-5 ${
                                  rental.status === 'active' ? 'text-blue-600 dark:text-blue-400' :
                                  rental.status === 'pending_payment' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`} />
                              </div>
                              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {rental.code || 'N/A'}
                              </CardTitle>
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(rental.status)}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-1 flex flex-col">
                          {/* Time Info Card */}
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                            <div className="flex items-center gap-2 mb-3">
                              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Thời gian
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Bắt đầu:</p>
                                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {rental.actual_start_time ? new Date(rental.actual_start_time).toLocaleString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    }) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-sm pt-2 border-t border-slate-200 dark:border-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Kết thúc:</p>
                                  <p className={`font-semibold truncate ${rental.actual_end_time ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                    {rental.actual_end_time ? new Date(rental.actual_end_time).toLocaleString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    }) : 'Chưa cập nhật'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Condition - 2 Columns */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Khi nhận */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">Khi nhận</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-1">
                                  <Gauge className="w-3 h-3 text-gray-600" />
                                  <span className="font-bold">{rental.vehicle_condition_before?.mileage || 0} km</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Battery className="w-3 h-3 text-green-600" />
                                  <span className="font-bold text-green-600">{rental.vehicle_condition_before?.battery_level || 0}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Khi trả */}
                            <div className={`rounded-lg p-3 border ${
                              rental.vehicle_condition_after
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                            }`}>
                              <p className={`text-xs font-bold mb-2 ${
                                rental.vehicle_condition_after 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>Khi trả</p>
                              {rental.vehicle_condition_after ? (
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Gauge className="w-3 h-3 text-gray-600" />
                                    <span className="font-bold">{rental.vehicle_condition_after.mileage} km</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Battery className="w-3 h-3 text-green-600" />
                                    <span className="font-bold text-green-600">{rental.vehicle_condition_after.battery_level}%</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-2">
                                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa trả xe</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Summary - Fixed Height */}
                          <div className="rounded-lg p-3 border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Tổng thanh toán:
                              </span>
                              <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                {rental.payments && rental.payments.length > 0
                                  ? formatCurrency(rental.payments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0))
                                  : '0đ'}
                              </span>
                            </div>
                            
                            {/* Always render this div to maintain consistent height */}
                            <div className={`flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-700 min-h-[24px] ${
                              rental.total_fees && Number(rental.total_fees) > 0 ? '' : 'invisible'
                            }`}>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                (Bao gồm phí phạt:
                              </span>
                              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                {rental.total_fees && Number(rental.total_fees) > 0 
                                  ? formatCurrency(Number(rental.total_fees)) 
                                  : '0đ'})</span>
                            </div>
                          </div>

                          {/* Action Button - Always at bottom */}
                          <div className="mt-auto pt-4">
                            <Button
                            onClick={() => handleViewDetail(rental)}
                            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
                          >
                            <Eye className="w-5 h-5 mr-2" />
                            Xem chi tiết
                          </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex justify-center"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 inline-flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="h-10 px-4 rounded-xl border-0 bg-gray-100 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 hover:text-white disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 transition-all duration-300"
                    >
                      ← Trước
                    </Button>
                    
                    <div className="flex items-center gap-1 px-3">
                      {[...Array(pagination.pages)].map((_, index) => {
                        const pageNum = index + 1;
                        const isCurrentPage = pageNum === pagination.page;
                        const isNearCurrent = Math.abs(pageNum - pagination.page) <= 1;
                        const isFirstOrLast = pageNum === 1 || pageNum === pagination.pages;
                        
                        if (isNearCurrent || isFirstOrLast) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-10 w-10 rounded-xl font-semibold transition-all duration-300 ${
                                isCurrentPage
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-110'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                          return <span key={pageNum} className="text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="h-10 px-4 rounded-xl border-0 bg-gray-100 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 hover:text-white disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 transition-all duration-300"
                    >
                      Sau →
                    </Button>
                  </div>
                </motion.div>
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


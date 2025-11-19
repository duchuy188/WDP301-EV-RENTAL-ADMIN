import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Image as ImageIcon,
  Search,
  X,
  Loader2,
  RotateCcw,
  MapPin,
  ArrowUpDown
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { AnimatedStatCard } from '../components/ui/animated-stat-card';
import MaintenanceService from '../components/service/maintenanceService';
import { MaintenanceReport, GetMaintenanceParams, MaintenanceStatus } from '../components/service/type/maintenanceTypes';
import { showToast } from '../lib/toast';
import { MaintenanceDetailModal } from '../components/MaintenanceDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { stationService } from '../components/service/stationService';
import { Station } from '../components/service/type/stationTypes';

export function MaintenancePage() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 600);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [stats, setStats] = useState({
    reported: 0,
    fixed: 0
  });
  const [filters, setFilters] = useState<GetMaintenanceParams>({
    page: 1,
    limit: 10,
    status: 'all',
    station_id: undefined,
    sort_by: 'createdAt',
    sort_order: 'desc'
  });
  const [selectedReport, setSelectedReport] = useState<MaintenanceReport | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch maintenance reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching maintenance reports with filters:', filters);
      
      const response = await MaintenanceService.getMaintenanceReports(filters);
      
      console.log('📊 API Response:', response);
      
      setReports(response.data.reports);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
      
      console.log('✅ Reports state updated:', response.data.reports.length, 'reports');
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách báo cáo';
      setError(errorMessage);
      showToast.error(`Lỗi tải dữ liệu: ${errorMessage}`);
      console.error('❌ Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const response = await stationService.getStations({ page: 1, limit: 999 });
        setStations(response.stations || []);
      } catch (err: any) {
        console.error('Error fetching stations:', err);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  // Client-side search filtering
  const filteredReports = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return reports;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    return reports.filter((report) => {
      // Search by code
      if (report.code?.toLowerCase().includes(searchLower)) return true;
      
      // Search by vehicle
      const vehicle = report.vehicle_id;
      if (typeof vehicle === 'object' && vehicle) {
        if (vehicle.name?.toLowerCase().includes(searchLower)) return true;
        if (vehicle.license_plate?.toLowerCase().includes(searchLower)) return true;
        if (vehicle.model?.toLowerCase().includes(searchLower)) return true;
      }
      
      // Search by station
      const station = report.station_id;
      if (typeof station === 'object' && station) {
        if (station.name?.toLowerCase().includes(searchLower)) return true;
        if (station.address?.toLowerCase().includes(searchLower)) return true;
      }
      
      // Search by title/description
      if (report.title?.toLowerCase().includes(searchLower)) return true;
      if (report.description?.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });
  }, [reports, debouncedSearchTerm]);

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value as MaintenanceStatus | 'all',
      page: 1
    }));
  };

  const handleStationChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      station_id: value || undefined,
      page: 1
    }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: sortOrder as 'asc' | 'desc',
      page: 1
    }));
  };

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters(prev => ({
      ...prev,
      status: 'all',
      station_id: undefined,
      page: 1
    }));
  }, []);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    fetchReports();
    showToast.success('Đã làm mới dữ liệu');
  };

  const handleViewDetail = (report: MaintenanceReport) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
  };

  const handleUpdate = () => {
    fetchReports();
  };

  // Get status badge
  const getStatusBadge = (status: MaintenanceStatus) => {
    return status === 'reported' ? (
      <Badge variant="warning" className="font-medium">
        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
        Đã báo cáo
      </Badge>
    ) : (
      <Badge variant="success" className="font-medium">
        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
        Đã sửa
      </Badge>
    );
  };

  // Extract vehicle name
  const getVehicleName = (vehicle: any): string => {
    if (typeof vehicle === 'string') return vehicle;
    return vehicle?.name || 'N/A';
  };

  // Extract station name
  const getStationName = (station: any): string => {
    if (typeof station === 'string') return station;
    return station?.name || 'N/A';
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
          <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 rounded-2xl py-5 px-8 shadow-xl border-0 overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Wrench className="w-7 h-7 text-white" />
                  </div>
                  Quản lý bảo trì
                </h1>
                <p className="text-green-50 dark:text-green-100">
                  Quản lý báo cáo bảo trì xe trong hệ thống
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <AnimatedStatCard
            title="Tổng số"
            value={stats.reported + stats.fixed}
            subtitle="báo cáo"
            icon={Wrench}
            gradientFrom="from-blue-500"
            gradientTo="to-blue-600"
            delay={0}
          />
          <AnimatedStatCard
            title="Đã báo cáo"
            value={stats.reported}
            subtitle="cần xử lý"
            icon={AlertTriangle}
            gradientFrom="from-orange-500"
            gradientTo="to-orange-600"
            delay={0.1}
          />
          <AnimatedStatCard
            title="Đã sửa"
            value={stats.fixed}
            subtitle={`${stats.reported + stats.fixed > 0 ? ((stats.fixed / (stats.reported + stats.fixed)) * 100).toFixed(0) : 0}%`}
            icon={CheckCircle}
            gradientFrom="from-green-500"
            gradientTo="to-green-600"
            delay={0.2}
          />
        </div>

        {/* Search & Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                {/* Row 1: Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo mã báo cáo, xe, trạm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-11"
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Xóa tìm kiếm"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {debouncedSearchTerm !== searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    </div>
                  )}
                </div>

                {/* Row 2: Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter by Station */}
                  <div className="relative w-full sm:w-56">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                    <select
                      value={filters.station_id || ''}
                      onChange={(e) => handleStationChange(e.target.value)}
                      disabled={loadingStations}
                      title="Lọc theo trạm"
                      aria-label="Lọc theo trạm"
                      className="w-full h-11 pl-10 pr-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none cursor-pointer hover:border-green-400 dark:hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingStations ? 'Đang tải trạm...' : 'Tất cả trạm'}
                      </option>
                      {stations.map((station) => (
                        <option key={station._id} value={station._id}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Status */}
                  <div className="relative w-full sm:w-48">
                    <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                    <select
                      value={filters.status || 'all'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      title="Lọc theo trạng thái"
                      aria-label="Lọc theo trạng thái"
                      className="w-full h-11 pl-10 pr-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none cursor-pointer hover:border-green-400 dark:hover:border-green-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="reported">⚠️ Đã báo cáo</option>
                      <option value="fixed">✅ Đã sửa</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="relative w-full sm:w-52">
                    <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                    <select
                      value={`${filters.sort_by}_${filters.sort_order}`}
                      onChange={(e) => handleSortChange(e.target.value)}
                      title="Sắp xếp"
                      aria-label="Sắp xếp"
                      className="w-full h-11 pl-10 pr-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none cursor-pointer hover:border-green-400 dark:hover:border-green-500"
                    >
                      <option value="createdAt_desc">Mới nhất</option>
                      <option value="createdAt_asc">Cũ nhất</option>
                    </select>
          </div>

                  {/* Reset Filters - Smart button chỉ hiện khi có filter */}
                  {(filters.status !== 'all' || filters.station_id || searchTerm) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="h-11 px-4 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline">Đặt lại</span>
                      </Button>
                    </motion.div>
                  )}
            </div>
          </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Danh sách báo cáo bảo trì
                  </h3>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-4">{error}</p>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Thử lại
                </Button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  {debouncedSearchTerm ? 'Không tìm thấy báo cáo phù hợp' : 'Không có báo cáo bảo trì nào'}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {debouncedSearchTerm 
                    ? `Không tìm thấy báo cáo với từ khóa "${debouncedSearchTerm}"` 
                    : 'Chưa có báo cáo bảo trì trong hệ thống'}
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Mã báo cáo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Xe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Mô tả
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredReports.map((report, index) => {
                        // Calculate sequential number based on pagination
                        const stt = ((pagination.page - 1) * pagination.limit) + index + 1;
                        return (
                        <tr
                          key={report._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center justify-center">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {stt}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-2 py-1 rounded inline-block">
                              {report.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {getVehicleName(report.vehicle_id)}
                            </div>
                            {typeof report.vehicle_id === 'object' && report.vehicle_id !== null && report.vehicle_id.license_plate && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {report.vehicle_id.license_plate}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-gray-900 dark:text-white">
                              {getStationName(report.station_id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="max-w-md">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {report.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {report.description}
                              </p>
                              {report.images && report.images.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <ImageIcon className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    {report.images.length} hình ảnh
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(report.createdAt).toLocaleTimeString('vi-VN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(report)}
                              className="group h-9 w-9 p-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
                              title="Xem chi tiết"
                              aria-label="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            </Button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Trang {pagination.page} / {pagination.pages} (Tổng {pagination.total} mục)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Trước
                        </Button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.pages - 2) {
                              pageNum = pagination.pages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
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
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <MaintenanceDetailModal
        report={selectedReport}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdate}
      />
    </div>
  );
}


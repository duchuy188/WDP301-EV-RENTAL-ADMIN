import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import MaintenanceService from '../components/service/maintenanceService';
import { MaintenanceReport, GetMaintenanceParams, MaintenanceStatus } from '../components/service/type/maintenanceTypes';
import { showToast } from '../lib/toast';
import { MaintenanceDetailModal } from '../components/MaintenanceDetailModal';

export function MaintenancePage() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchReports();
  }, [filters]);

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value as MaintenanceStatus | 'all',
      page: 1
    }));
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Tổng số</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.reported + stats.fixed}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">báo cáo</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Wrench className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Đã báo cáo</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.reported}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">cần xử lý</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Đã sửa</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.fixed}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats.reported + stats.fixed > 0 
                    ? ((stats.fixed / (stats.reported + stats.fixed)) * 100).toFixed(0) 
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                  <SelectItem value="reported">⚠️ Đã báo cáo</SelectItem>
                  <SelectItem value="fixed">✅ Đã sửa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Hiển thị {reports.length} / {pagination.total} báo cáo
                  </p>
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
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  Không có báo cáo bảo trì nào
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Chưa có báo cáo bảo trì trong hệ thống
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
                      {reports.map((report, index) => {
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
                            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
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


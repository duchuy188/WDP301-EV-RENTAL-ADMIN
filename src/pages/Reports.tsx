import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaMotorcycle } from 'react-icons/fa';
import { 
  AlertTriangle, 
  Eye, 
  Filter,
  TrendingUp,
  CheckCircle,
  Clock,
  RefreshCw,
  MapPin,
  RotateCcw,
  Car,
  FileText
} from 'lucide-react';
import { EnhancedDataTable, EnhancedColumn } from '../components/EnhancedDataTable';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import { AnimatedStatCard } from '../components/ui/animated-stat-card';
import ReportService from '../components/service/reportService';
import { Report, GetReportsParams, IssueType, ReportStatus, getIssueTypeLabel, getReportStatusLabel, getReportStatusColor, getIssueTypeColor } from '../components/service/type/reportTypes';
import { showToast } from '../lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ReportDetailModal } from '../components/ReportDetailModal';
import { stationService } from '../components/service/stationService';
import { Station } from '../components/service/type/stationTypes';

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    byIssueType: {
      accident: 0,
      battery_issue: 0,
      vehicle_breakdown: 0,
      other: 0
    }
  });
  const [filters, setFilters] = useState<GetReportsParams>({
    page: 1,
    limit: 10
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch report stats (with fallback to calculation if API not available)
  const fetchStats = useCallback(async () => {
    try {
      const statsParams = filters.station_id ? { station_id: filters.station_id } : undefined;
      const response = await ReportService.getStats(statsParams);
      
      console.log('📊 Stats API Response:', response);
      
      // Map stats to state format
      const byTypeMap = response.data.byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);
      
      setStats({
        total: response.data.total,
        pending: response.data.pending,
        resolved: response.data.resolved,
        byIssueType: {
          accident: byTypeMap.accident || 0,
          battery_issue: byTypeMap.battery_issue || 0,
          vehicle_breakdown: byTypeMap.vehicle_breakdown || 0,
          other: byTypeMap.other || 0
        }
      });
    } catch (err: any) {
      // Fallback: Calculate stats from current data when API not available
      console.warn('⚠️ Stats API not available, calculating from data');
    }
  }, [filters.station_id]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await ReportService.getReports(filters);
      
      console.log('📊 Reports API Response:', response);
      console.log('📊 Reports data:', response.data);
      
      // Validate response data
      const reportsData = Array.isArray(response.data) ? response.data : [];
      
      setReports(reportsData);
      setPagination(response.pagination);
      
      // Fallback: Calculate stats from fetched data if stats API failed
      const newStats = {
        total: response.pagination.total,
        pending: reportsData.filter(r => r && r.status === 'pending').length,
        resolved: reportsData.filter(r => r && r.status === 'resolved').length,
        byIssueType: {
          accident: reportsData.filter(r => r && r.issue_type === 'accident').length,
          battery_issue: reportsData.filter(r => r && r.issue_type === 'battery_issue').length,
          vehicle_breakdown: reportsData.filter(r => r && r.issue_type === 'vehicle_breakdown').length,
          other: reportsData.filter(r => r && r.issue_type === 'other').length
        }
      };
      setStats(newStats);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách báo cáo';
      showToast.error(errorMessage);
      console.error('❌ Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

  // Fetch reports and stats when filters change
  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [fetchReports, fetchStats]);

  // Filter handlers
  const handleStatusChange = useCallback((value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: value === 'all' ? undefined : value as ReportStatus,
      page: 1 
    }));
  }, []);

  const handleIssueTypeChange = useCallback((value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      issue_type: value === 'all' ? undefined : value as IssueType,
      page: 1 
    }));
  }, []);

  const handleStationChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      station_id: value === 'all' ? undefined : value,
      page: 1
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // View report details
  const handleViewReport = useCallback((report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedReport(null);
  }, []);

  // Define table columns
  const columns: EnhancedColumn[] = [
    {
      key: 'stt',
      header: 'STT',
      render: (_value: any, _report: Report, index?: number) => (
        <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          {((filters.page || 1) - 1) * (filters.limit || 10) + (index || 0) + 1}
        </div>
      )
    },
    {
      key: 'code',
      header: 'Mã báo cáo',
      sortable: true,
      render: (_value: any, report: Report) => (
        <div className="font-mono font-semibold text-gray-900 dark:text-white">
          {report.code}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (_value: any, report: Report) => (
        <div className="flex justify-center">
          <Badge className={`${getReportStatusColor(report.status)} min-w-[130px] justify-center`}>
            {report.status === 'pending' ? (
              <Clock size={14} className="mr-1" />
            ) : (
              <CheckCircle size={14} className="mr-1" />
            )}
            {getReportStatusLabel(report.status)}
          </Badge>
        </div>
      )
    },
    {
      key: 'issue_type',
      header: 'Loại sự cố',
      sortable: true,
      render: (_value: any, report: Report) => (
        <div className="flex justify-center">
          <Badge className={`${getIssueTypeColor(report.issue_type)} min-w-[140px] justify-center`}>
            {getIssueTypeLabel(report.issue_type)}
          </Badge>
        </div>
      )
    },
    {
      key: 'vehicle_id',
      header: 'Xe',
      render: (_value: any, report: Report) => (
        <div className="flex items-center gap-2">
          <FaMotorcycle className="text-gray-500 dark:text-gray-400" size={16} />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {report.vehicle_id.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {report.vehicle_id.license_plate}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'station_id',
      header: 'Trạm',
      render: (_value: any, report: Report) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
          <div className="max-w-[150px]">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {report.station_id.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {report.station_id.address}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      render: (_value: any, report: Report) => {
        const [date, time] = report.createdAt.split(' ');
        return (
          <div className="text-sm text-gray-600">
            <div>{date}</div>
            <div className="text-xs text-gray-500">{time}</div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (_value: any, report: Report) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewReport(report);
          }}
          className="group h-9 w-9 p-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
          title="Xem chi tiết báo cáo"
          aria-label="Xem chi tiết báo cáo"
        >
          <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
        </Button>
      )
    }
  ];

  // Stats cards
  const statsCards = [
    {
      title: 'Tổng báo cáo',
      value: stats.total,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Chờ xử lý',
      value: stats.pending,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Đã giải quyết',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Tai nạn',
      value: stats.byIssueType.accident,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

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
                  <AlertTriangle className="w-8 h-8" />
                  Quản lý báo cáo sự cố
                </h1>
                <p className="text-white/90 text-sm mt-1">Quản lý và xử lý báo cáo sự cố từ khách hàng</p>
              </div>
              <Button
                onClick={fetchReports}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/40 hover:border-white/60 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((stat, index) => (
            <AnimatedStatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              gradientFrom={stat.color.split(' ')[0]}
              gradientTo={stat.color.split(' ')[1]}
              bgColor={stat.bgColor}
              textColor={stat.textColor}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <Select
                value={filters.status || 'all'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="resolved">Đã giải quyết</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Issue Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại sự cố
              </label>
              <Select
                value={filters.issue_type || 'all'}
                onValueChange={handleIssueTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="accident">Tai nạn</SelectItem>
                  <SelectItem value="battery_issue">Vấn đề pin</SelectItem>
                  <SelectItem value="vehicle_breakdown">Hỏng xe</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Station Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạm xe
              </label>
              <Select
                value={filters.station_id || 'all'}
                onValueChange={handleStationChange}
                disabled={loadingStations}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạm</SelectItem>
                  {stations.map((station) => (
                    <SelectItem key={station._id} value={station._id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Đặt lại
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <EnhancedDataTable
            title="Danh sách báo cáo sự cố"
            data={reports}
            columns={columns}
            loading={loading}
            emptyMessage="Không có báo cáo nào"
          />
          
          {/* Pagination */}
          {!loading && reports.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <ProfessionalPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                itemsPerPage={pagination.limit}
                totalItems={pagination.total}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleLimitChange}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

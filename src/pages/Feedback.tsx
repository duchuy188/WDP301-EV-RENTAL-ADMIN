import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  ThumbsUp, 
  AlertCircle, 
  Eye, 
  Filter,
  Star,
  TrendingUp,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { EnhancedDataTable, EnhancedColumn } from '../components/EnhancedDataTable';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import FeedbackService from '../components/service/feedbackService';
import { Feedback, GetFeedbacksParams, FeedbackType, FeedbackStatus, FeedbackCategory } from '../components/service/type/feedbackTypes';
import { showToast } from '../lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FeedbackDetailModal } from '../components/FeedbackDetailModal';

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    ratings: 0,
    complaints: 0,
    pending: 0,
    resolved: 0
  });
  const [filters, setFilters] = useState<GetFeedbacksParams>({
    page: 1,
    limit: 10,
  });
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch feedbacks on component mount and when filters change
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching feedbacks with filters:', filters);
      
      const response = await FeedbackService.getFeedbacks(filters);
      
      console.log('📊 API Response:', response);
      
      setFeedbacks(response.data.feedbacks);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
      
      console.log('✅ Feedbacks state updated:', response.data.feedbacks.length, 'feedbacks');
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách phản hồi';
      showToast.error(`Lỗi tải dữ liệu: ${errorMessage}`);
      console.error('❌ Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filters]);

  // Handle filter changes
  const handleTypeChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      type: value === 'all' ? undefined : value as FeedbackType,
      page: 1 
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: value === 'all' ? undefined : value as FeedbackStatus,
      page: 1 
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      category: value === 'all' ? undefined : value as FeedbackCategory,
      page: 1 
    }));
  };

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleUpdate = () => {
    fetchFeedbacks();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleRefresh = () => {
    fetchFeedbacks();
    showToast.success('Đã làm mới dữ liệu');
  };

  // Table columns configuration
  const columns: EnhancedColumn[] = [
    {
      key: '_id',
      header: 'STT',
      width: '80px',
      render: (_value: any, _row: any, index?: number) => {
        // Calculate sequential number based on pagination
        const stt = ((pagination.page - 1) * pagination.limit) + (index || 0) + 1;
        return (
          <div className="flex items-center justify-center">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {stt}
            </span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Loại',
      width: '130px',
      render: (value: any) => (
        <Badge variant={value === 'rating' ? 'default' : 'warning'} className="font-medium">
          {value === 'rating' ? (
            <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Đánh giá</>
          ) : (
            <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Khiếu nại</>
          )}
        </Badge>
      ),
    },
    {
      key: 'title',
      header: 'Nội dung',
      sortable: true,
      width: '180px',
      render: (_value: any, row: any) => (
        <div className="py-1 max-w-[180px]">
          <p className="font-semibold text-gray-900 dark:text-white truncate mb-1 text-xs">
            {row.type === 'complaint' ? row.title : 'Đánh giá dịch vụ'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {row.type === 'complaint' ? row.description : row.comment}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Phân loại',
      width: '180px',
      render: (value: any, row: any) => {
        // For complaints - show specific category
        if (row.type === 'complaint') {
          if (!value) {
            return (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Chưa phân loại
              </span>
            );
          }
          
          const categoryLabels: Record<string, { label: string; color: string }> = {
            vehicle: { label: 'Xe', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
            staff: { label: 'Nhân viên', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
            payment: { label: 'Thanh toán', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            service: { label: 'Dịch vụ', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
            other: { label: 'Khác', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
          };
          const cat = categoryLabels[value] || categoryLabels.other;
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
              {cat.label}
            </span>
          );
        }
        
        // For ratings - show rating criteria
        const ratingCriteria = [];
        if (row.overall_rating) ratingCriteria.push('Tổng thể');
        if (row.staff_service) ratingCriteria.push('Nhân viên');
        if (row.vehicle_condition) ratingCriteria.push('Xe');
        if (row.station_cleanliness) ratingCriteria.push('Trạm');
        if (row.checkout_process) ratingCriteria.push('Quy trình');
        
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <ThumbsUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {ratingCriteria.length} tiêu chí
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 pl-5">
              {ratingCriteria.slice(0, 2).join(', ')}
              {ratingCriteria.length > 2 && '...'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'overall_rating',
      header: 'Đánh giá',
      width: '140px',
      render: (value: any, row: any) => {
        if (row.type === 'complaint') {
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Không có
              </span>
            </div>
          );
        }
        const rating = value || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-gray-900 dark:text-white">{rating}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/5</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '150px',
      render: (value: any, row: any) => {
        if (row.type === 'rating') {
          return (
            <Badge variant="success" className="font-medium">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Hoàn thành
            </Badge>
          );
        }
        return (
          <Badge variant={value === 'resolved' ? 'success' : 'warning'} className="font-medium">
            {value === 'resolved' ? (
              <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Đã giải quyết</>
            ) : (
              <><Clock className="w-3.5 h-3.5 mr-1.5" /> Chờ xử lý</>
            )}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      width: '180px',
      render: (value: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {new Date(value).toLocaleDateString('vi-VN')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Hành động',
      width: '100px',
      render: (_value: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row)}
            className="group h-9 w-9 p-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
          >
            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        </div>
      ),
    },
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
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  Quản lý phản hồi
                </h1>
                <p className="text-green-50 dark:text-green-100">
                  Quản lý đánh giá và khiếu nại từ khách hàng
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
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Tổng số</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">phản hồi</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Đánh giá</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.ratings}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {((stats.ratings / stats.total) * 100 || 0).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <ThumbsUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Khiếu nại</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.complaints}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {((stats.complaints / stats.total) * 100 || 0).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Chờ xử lý</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">cần xử lý</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Đã giải quyết</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.resolved}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {stats.complaints > 0 ? ((stats.resolved / stats.complaints) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
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
                Loại phản hồi
              </label>
              <Select value={filters.type || 'all'} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="rating">🌟 Đánh giá</SelectItem>
                  <SelectItem value="complaint">⚠️ Khiếu nại</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="pending">⏳ Chờ xử lý</SelectItem>
                  <SelectItem value="resolved">✅ Đã giải quyết</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục (Khiếu nại)
              </label>
              <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="vehicle">🚗 Xe</SelectItem>
                  <SelectItem value="staff">👤 Nhân viên</SelectItem>
                  <SelectItem value="payment">💳 Thanh toán</SelectItem>
                  <SelectItem value="service">🛠️ Dịch vụ</SelectItem>
                  <SelectItem value="other">📋 Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <EnhancedDataTable
            data={feedbacks}
            columns={columns}
            loading={loading}
            searchable={false}
            exportable={false}
            emptyMessage="Không có phản hồi nào"
            showInfo={false}
          />
          
          {/* Professional Pagination */}
          {pagination.pages > 1 && (
            <ProfessionalPagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              pageSizeOptions={[10, 25, 50, 100]}
              loading={loading}
              itemsLabel="phản hồi"
              className="mt-6"
            />
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleUpdate}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  ThumbsUp, 
  AlertCircle, 
  Loader2, 
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
import FeedbackService from '../components/service/feedbackService';
import { Feedback, GetFeedbacksParams, FeedbackType, FeedbackStatus, FeedbackCategory } from '../components/service/type/feedbackTypes';
import { showToast } from '../lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FeedbackDetailModal } from '../components/FeedbackDetailModal';

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      
      console.log('🔍 Fetching feedbacks with filters:', filters);
      
      const response = await FeedbackService.getFeedbacks(filters);
      
      console.log('📊 API Response:', response);
      
      setFeedbacks(response.data.feedbacks);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
      
      console.log('✅ Feedbacks state updated:', response.data.feedbacks.length, 'feedbacks');
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách phản hồi';
      setError(errorMessage);
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
  const columns: EnhancedColumn<Feedback>[] = [
    {
      key: '_id',
      label: 'ID',
      width: '120px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
            {value.substring(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Loại',
      width: '130px',
      render: (value) => (
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
      label: 'Nội dung',
      sortable: true,
      render: (value, row) => (
        <div className="max-w-md py-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate mb-1">
            {row.type === 'complaint' ? row.title : 'Đánh giá dịch vụ'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {row.type === 'complaint' ? row.description : row.comment}
          </p>
        </div>
      ),
    },
    {
      key: 'overall_rating',
      label: 'Đánh giá',
      width: '140px',
      render: (value, row) => {
        if (row.type === 'complaint') {
          return <span className="text-gray-400 text-sm">—</span>;
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
      key: 'category',
      label: 'Danh mục',
      width: '130px',
      render: (value, row) => {
        if (row.type === 'rating' || !value) {
          return <span className="text-gray-400 text-sm">—</span>;
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
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      width: '150px',
      render: (value, row) => {
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
      label: 'Ngày tạo',
      sortable: true,
      width: '180px',
      render: (value) => (
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
      key: '_id',
      label: 'Thao tác',
      width: '120px',
      render: (value, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(row)}
          className="hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Chi tiết
        </Button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                Quản lý phản hồi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quản lý đánh giá và khiếu nại từ khách hàng
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
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            emptyMessage="Không có phản hồi nào"
          />
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

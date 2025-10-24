import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import paymentService from '../components/service/paymentService';
import {
  PaymentUI,
  PaymentQueryParams,
  PaymentSummary,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS
} from '../components/service/type/paymentTypes';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { showToast } from '../lib/toast';

export function Payments() {
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  // Fetch payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: PaymentQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        payment_type: paymentTypeFilter || undefined,
        payment_method: paymentMethodFilter || undefined,
        sort: 'createdAt',
        order: 'desc'
      };

      const response = await paymentService.getPayments(params);
      setPayments(response.data);
      setSummary(response.summary || null);
      
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
        setTotalPayments(response.pagination.total);
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter, paymentTypeFilter, paymentMethodFilter]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPayments();
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params: PaymentQueryParams = {
        status: statusFilter || undefined,
        payment_type: paymentTypeFilter || undefined,
        payment_method: paymentMethodFilter || undefined,
        search: searchTerm || undefined
      };

      const blob = await paymentService.exportPayments(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Xuất dữ liệu thành công');
    } catch (error: any) {
      console.error('Error exporting payments:', error);
      showToast.error('Không thể xuất dữ liệu');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('');
    setPaymentTypeFilter('');
    setPaymentMethodFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get payment type badge color
  const getPaymentTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rental':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'penalty':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'refund':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 rounded-2xl py-5 px-8 shadow-xl border-0 overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg">
              Quản lý Thanh toán
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Quản lý và theo dõi các giao dịch thanh toán
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchPayments}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </Button>
            <Button
              onClick={handleExport}
              className="bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tổng doanh thu</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.totalAmount)}
                </h3>
              </div>
              <DollarSign className="h-12 w-12 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Đã thanh toán</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.paidAmount)}
                </h3>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Đang chờ</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.pendingAmount)}
                </h3>
              </div>
              <Clock className="h-12 w-12 text-yellow-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Hoàn tiền</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.refundAmount)}
                </h3>
              </div>
              <RefreshCw className="h-12 w-12 text-purple-200" />
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo mã thanh toán hoặc tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} className="bg-primary-600 hover:bg-primary-700">
              Tìm kiếm
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-gray-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t"
            >
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạng thái
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Đang chờ</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="failed">Thất bại</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>
              </div>

              <div>
                <label htmlFor="payment-type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại thanh toán
                </label>
                <select
                  id="payment-type-filter"
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả</option>
                  <option value="deposit">Đặt cọc</option>
                  <option value="rental">Thuê xe</option>
                  <option value="penalty">Phạt</option>
                  <option value="refund">Hoàn tiền</option>
                </select>
              </div>

              <div>
                <label htmlFor="payment-method-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phương thức thanh toán
                </label>
                <select
                  id="payment-method-filter"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả</option>
                  <option value="qr_code">QR Code</option>
                  <option value="vnpay">VNPay</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mã thanh toán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-3 text-gray-500">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Không có dữ liệu thanh toán
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => {
                  const stt = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stt}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.customerName}
                          </div>
                          {payment.customerEmail && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payment.customerEmail}
                            </div>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.refundAmount && payment.refundAmount > 0 && (
                        <div className="text-xs text-red-600">
                          Hoàn: {formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPaymentTypeBadgeClass(payment.paymentType)}>
                        {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadgeClass(payment.status)}>
                        {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                      </Badge>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payment.createdAt)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, totalPayments)} trong tổng số {totalPayments} thanh toán
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2">...</span>}
                </div>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Payments;


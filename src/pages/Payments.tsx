import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  Loader2
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import paymentService from '../components/service/paymentService';
import {
  PaymentUI,
  PaymentQueryParams,
  PaymentSummary,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS
} from '../components/service/type/paymentTypes';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { showToast } from '../lib/toast';
import { useDebounce } from '../hooks/useDebounce';

export function Payments() {
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // Filters
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
        search: debouncedSearchTerm || undefined,
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
  }, [currentPage, paymentTypeFilter, paymentMethodFilter, debouncedSearchTerm]);

  // Handle search (kept for backward compatibility, but auto-search is now enabled)
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPayments();
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params: PaymentQueryParams = {
        payment_type: paymentTypeFilter || undefined,
        payment_method: paymentMethodFilter || undefined,
        search: debouncedSearchTerm || undefined
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
    setPaymentTypeFilter('');
    setPaymentMethodFilter('');
    setSearchTerm('');
    setCurrentPage(1);
    // fetchPayments will be called automatically by useEffect
  };

  // Get payment type badge color
  const getPaymentTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rental_fee':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'additional_fee':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'holding_fee':
        return 'bg-teal-100 text-teal-800 border-teal-200';
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
        {/* Info Banner */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Phương thức thanh toán được hỗ trợ:
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md font-semibold px-3 py-1">
                  💳 VNPay
                </Badge>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md font-semibold px-3 py-1">
                  💵 Tiền mặt
                </Badge>
              </div>
            </div>
          </div>
        </div>

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
                  className="pl-10 pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t"
            >
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
                  <option value="deposit">💰 Tiền cọc</option>
                  <option value="rental_fee">🚗 Phí thuê xe</option>
                  <option value="additional_fee">⚠️ Phí phát sinh</option>
                  <option value="holding_fee">🏍️ Phí giữ xe</option>
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
                  <option value="vnpay">💳 VNPay</option>
                  <option value="cash">💵 Tiền mặt</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-3 text-gray-500">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                      {payment.paymentType === 'deposit' ? (
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[130px]">
                          💰 Tiền cọc
                        </Badge>
                      ) : payment.paymentType === 'rental' || payment.paymentType === 'rental_fee' ? (
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[130px]">
                          🚗 Phí thuê xe
                        </Badge>
                      ) : payment.paymentType === 'penalty' || payment.paymentType === 'additional_fee' ? (
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[130px]">
                          ⚠️ Phí phát sinh
                        </Badge>
                      ) : payment.paymentType === 'holding_fee' ? (
                        <Badge className="bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[130px]">
                          🏍️ Phí giữ xe
                        </Badge>
                      ) : payment.paymentType === 'refund' ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[130px]">
                          ↩️ Hoàn tiền
                        </Badge>
                      ) : (
                        <Badge className={getPaymentTypeBadgeClass(payment.paymentType)}>
                          {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                        </Badge>
                      )}
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
                      {payment.paymentMethod === 'vnpay' ? (
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[110px]">
                          💳 VNPay
                        </Badge>
                      ) : payment.paymentMethod === 'cash' ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md font-semibold inline-flex items-center justify-center min-w-[110px]">
                          💵 Tiền mặt
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-500 italic">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                        </span>
                      )}
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

      </Card>

      {/* Professional Pagination */}
      {totalPages > 1 && (
        <ProfessionalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalPayments}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => {
            setCurrentPage(1);
            // You may need to update itemsPerPage state and refetch
            fetchPayments();
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          loading={loading}
          itemsLabel="thanh toán"
        />
      )}
    </div>
  );
}

export default Payments;


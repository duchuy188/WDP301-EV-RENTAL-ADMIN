import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, Loader2, Eye, Filter, RefreshCw, X, RotateCcw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import { UserService } from '../components/service/userService';
import { RiskyCustomer, RiskyCustomersParams } from '../components/service/type/userTypes';
import { formatDate } from '../utils/dateUtils';
import { showToast } from '../lib/toast';
import RiskyCustomerDetailModal from '../components/RiskyCustomerDetailModal';

export default function RiskyCustomers() {
  const [customers, setCustomers] = useState<RiskyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500); // Debounce 600ms
  const [minRiskScore, setMinRiskScore] = useState<number | undefined>();
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical' | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRiskyCustomers();
  }, [pagination.page, pagination.limit, minRiskScore, riskLevel, debouncedSearchQuery]);

  const fetchRiskyCustomers = async () => {
    try {
      setLoading(true);
      const params: RiskyCustomersParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchQuery || undefined,
        minRiskScore,
        riskLevel,
      };

      const response = await UserService.getRiskyCustomers(params);
      console.log('Risky customers response:', response);
      setCustomers(response.customers || []);
      setPagination(response.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
    } catch (error: any) {
      console.error('Error fetching risky customers:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng rủi ro');
    } finally {
      setLoading(false);
    }
  };

  // Memoized handlers
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleViewDetail = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowDetailModal(true);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setMinRiskScore(undefined);
    setRiskLevel(undefined);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchRiskyCustomers();
  }, [pagination.page, pagination.limit, debouncedSearchQuery, minRiskScore, riskLevel]);

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Nghiêm trọng</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">Cao</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Trung bình</Badge>;
      case 'low':
        return <Badge className="bg-green-500 text-white">Thấp</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
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
            <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-yellow-300 drop-shadow-lg" />
              Khách hàng rủi ro
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Theo dõi và quản lý khách hàng có hành vi rủi ro cao
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
      </motion.div>

      {/* Search & Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            {/* Search with Clear Button & Debounce Loading */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Xóa tìm kiếm"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {loading && debouncedSearchQuery !== searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-gray-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
            </Button>

            {/* Reset Filters - chỉ hiện khi có filter active */}
            {(searchQuery || minRiskScore || riskLevel) && (
              <Button 
                onClick={handleResetFilters} 
                variant="outline"
                className="px-4 flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Đặt lại</span>
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              {/* Điểm rủi ro tối thiểu */}
              <div>
                <label htmlFor="minRiskScore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm rủi ro tối thiểu (0-100)
                </label>
                <Input
                  id="minRiskScore"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Ví dụ: 30"
                  value={minRiskScore || ''}
                  onChange={(e) => setMinRiskScore(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label htmlFor="riskLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mức độ rủi ro
                </label>
                <select
                  id="riskLevel"
                  value={riskLevel || ''}
                  onChange={(e) => setRiskLevel(e.target.value as any || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tất cả</option>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Nghiêm trọng</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <>
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Danh sách khách hàng rủi ro
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Điểm rủi ro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mức độ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vi phạm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vi phạm gần nhất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        Không tìm thấy khách hàng rủi ro
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <motion.tr
                        key={customer._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.fullname}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-red-600">
                            {customer.riskInfo.risk_score}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRiskLevelBadge(customer.riskInfo.risk_level)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {customer.riskInfo.total_violations} lần
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.riskInfo.last_violation_date 
                              ? formatDate(customer.riskInfo.last_violation_date)
                              : 'Chưa có'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={customer.status === 'active' ? 'success' : 'destructive'}>
                            {customer.status === 'active' ? 'Hoạt động' : 'Bị chặn'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(customer._id)}
                              className="group h-9 w-9 p-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
                              title="Xem chi tiết khách hàng rủi ro"
                              aria-label="Xem chi tiết khách hàng rủi ro"
                            >
                              <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Professional Pagination */}
          {pagination.pages > 1 && (
            <ProfessionalPagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              onItemsPerPageChange={(limit) => {
                setPagination(prev => ({ ...prev, limit, page: 1 }));
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              loading={loading}
              itemsLabel="khách hàng rủi ro"
            />
          )}
        </>
      )}

      {/* Detail Modal */}
      <RiskyCustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCustomerId(null);
        }}
        customerId={selectedCustomerId}
        onUpdate={fetchRiskyCustomers}
      />
    </div>
  );
}

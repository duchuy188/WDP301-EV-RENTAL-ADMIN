import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, Loader2, Eye, Filter, RefreshCw } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
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
  const [minRiskScore, setMinRiskScore] = useState<number | undefined>();
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical' | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRiskyCustomers();
  }, [pagination.page, pagination.limit, minRiskScore, riskLevel]);

  const fetchRiskyCustomers = async () => {
    try {
      setLoading(true);
      const params: RiskyCustomersParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
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

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchRiskyCustomers();
  };

  const handleViewDetail = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowDetailModal(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinRiskScore(undefined);
    setRiskLevel(undefined);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          Khách hàng rủi ro
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theo dõi và quản lý khách hàng có hành vi rủi ro cao
        </p>
      </motion.div>

      {/* Search & Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="px-6 bg-primary-600 hover:bg-primary-700">
              <Search className="h-4 w-4 mr-2" />
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
            <Button
              onClick={fetchRiskyCustomers}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
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

              <div className="md:col-span-2">
                <Button onClick={handleResetFilters} variant="outline" size="sm">
                  Xóa bộ lọc
                </Button>
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
        <Card>
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
                    Thao tác
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
                            : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={customer.status === 'active' ? 'success' : 'destructive'}>
                          {customer.status === 'active' ? 'Hoạt động' : 'Bị chặn'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => handleViewDetail(customer._id)}
                          size="sm"
                          variant="outline"
                          className="border-primary-600 text-primary-600 hover:bg-primary-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Chi tiết
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} khách hàng
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Trước
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          variant={pagination.page === page ? 'default' : 'outline'}
                          size="sm"
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {pagination.pages > 5 && <span className="px-2">...</span>}
                  </div>
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
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

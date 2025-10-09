import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Loader2, Search, ChevronLeft, ChevronRight, Eye, Lock, Unlock } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UserService } from '../components/service/userService';
import { User as UserType, UsersParams } from '../components/service/type/userTypes';
import { UserDetailModal } from '../components/UserDetailModal';
import { showToast } from '../lib/toast';

export function Customers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [filters, setFilters] = useState<UsersParams>({
    page: 1,
    limit: 10,
    role: 'EV Renter', // Chỉ hiển thị EV Renter
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Log filters being used
        console.log('🔍 Fetching users with filters:', {
          ...filters,
          search: searchQuery || undefined,
        });
        
        const response = await UserService.getUsers({
          ...filters,
          search: searchQuery || undefined,
        });
        
        // Log the complete API response
        console.log('📊 API Response:', response);
        console.log('👥 Users data:', response.users);
        console.log('📄 Pagination info:', response.pagination);
        
        // Log individual user details
        response.users.forEach((user, index) => {
          console.log(`👤 User ${index + 1}:`, {
            id: user._id,
            name: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            kycStatus: user.kycStatus,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
        });
        
        setUsers(response.users);
        setPagination(response.pagination);
        
        // Log final state
        console.log('✅ Users state updated:', response.users.length, 'users');
        console.log('📊 Total users available:', response.pagination.total);
        console.log('📄 Current page:', response.pagination.page, 'of', response.pagination.pages);
        
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách khách hàng';
        setError(errorMessage);
        showToast.error(`Lỗi tải dữ liệu: ${errorMessage}`);
        console.error('❌ Error fetching users:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filters, searchQuery]);

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof UsersParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle modal
  const handleViewUser = (user: UserType) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUpdated = async () => {
    // re-fetch current page with current filters
    try {
      setLoading(true);
      const response = await UserService.getUsers({
        ...filters,
        search: searchQuery || undefined,
      });
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải dữ liệu';
      setError(errorMessage);
      showToast.error(`Lỗi tải dữ liệu: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: UserType) => {
    try {
      setTogglingId(user._id);
      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      await UserService.updateUserStatus(user._id, nextStatus);
      // Optimistic update
      setUsers(prev => prev.map(u => (u._id === user._id ? { ...u, status: nextStatus } : u)));
      
      // Show success message
      const statusText = nextStatus === 'active' ? 'đã được kích hoạt' : 'đã bị chặn';
      showToast.success(`Tài khoản ${user.fullname} ${statusText} thành công!`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái';
      showToast.error(`Lỗi cập nhật trạng thái: ${errorMessage}`);
      console.error('Error updating user status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePreviousPage = () => {
    if (filters.page && filters.page > 1) {
      handlePageChange(filters.page - 1);
    }
  };

  const handleNextPage = () => {
    if (filters.page && filters.page < pagination.pages) {
      handlePageChange(filters.page + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const currentPage = filters.page || 1;
    const totalPages = pagination.pages;
    const pages = [];
    
    // Show first page
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) {
        pages.push('...');
      }
    }
    
    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i);
    }
    
    // Show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const columns = [
    {
      key: 'stt',
      header: 'STT',
      render: (_value: any, _row: any, index?: number) => {
        const currentPage = filters.page || 1;
        const limit = filters.limit || 10;
        const stt = (currentPage - 1) * limit + (index ?? 0) + 1;
        return (
          <span className="font-medium text-sm text-gray-600 dark:text-gray-400">
            {stt}
          </span>
        );
      }
    },
    {
      key: 'fullname',
      header: 'Tên khách hàng',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {row.avatar ? (
              <img 
                src={row.avatar} 
                alt={value}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <User className={`h-4 w-4 text-gray-500 ${row.avatar ? 'hidden' : ''}`} />
          </div>
          <div>
            <span className="font-medium">{value}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      render: (value: string, _row: any) => (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value: string, _row: any) => (
        <Badge variant={value === 'active' ? 'success' : 'destructive'}>
          {value === 'active' ? 'Hoạt động' : 'Đã chặn'}
        </Badge>
      )
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      render: (value: string, _row: any) => (
        <Badge variant={value === 'approved' ? 'success' : value === 'pending' ? 'warning' : value === 'not_submitted' ? 'secondary' : 'destructive'}>
          {value === 'approved' ? 'Đã duyệt' : value === 'pending' ? 'Chờ duyệt' : value === 'not_submitted' ? 'Chưa nộp' : 'Từ chối'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Hành động',
      render: (_value: any, row: UserType) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewUser(row)}
            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus(row)}
            disabled={togglingId === row._id}
            className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
            title={row.status === 'active' ? 'Đình chỉ tài khoản' : 'Kích hoạt tài khoản'}
            aria-label={row.status === 'active' ? 'Đình chỉ tài khoản' : 'Kích hoạt tài khoản'}
          >
            {row.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
        </div>
      )
    }
  ];

  // Calculate statistics from API data
  const totalCustomers = pagination.total;
  const activeCustomers = users.filter(u => u.status === 'active').length;
  const suspendedCustomers = users.filter(u => u.status === 'suspended').length;

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý khách hàng (EV Renter)
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý thông tin và theo dõi hoạt động của khách hàng thuê xe điện
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Tổng EV Renter
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {totalCustomers}
              </p>
            </div>
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                EV Renter hoạt động
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {activeCustomers}
              </p>
            </div>
            <User className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                EV Renter đã chặn
              </p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                {suspendedCustomers}
              </p>
            </div>
            <User className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Filter - Hidden since we only show EV Renter */}
          <div className="md:w-48 hidden">
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title="Lọc theo vai trò"
              aria-label="Lọc theo vai trò"
            >
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Station Staff">Station Staff</option>
              <option value="EV Renter">EV Renter</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title="Lọc theo trạng thái"
              aria-label="Lọc theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Đã chặn</option>
            </select>
          </div>

          {/* Search Button */}
          <Button onClick={handleSearch} className="px-6">
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>
      </motion.div>

      {/* Customer Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-600 dark:text-red-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Lỗi tải dữ liệu
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          title="Danh sách khách hàng EV Renter"
          columns={columns}
          data={users}
        />
      )}

      {/* Pagination */}
      {!loading && !error && pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị {((filters.page || 1) - 1) * (filters.limit || 10) + 1} - {Math.min((filters.page || 1) * (filters.limit || 10), pagination.total)} trong tổng số {pagination.total} kết quả
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!filters.page || filters.page <= 1}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trước</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <Button
                        variant={page === filters.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="w-10 h-10 p-0"
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!filters.page || filters.page >= pagination.pages}
                className="flex items-center space-x-1"
              >
                <span>Sau</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
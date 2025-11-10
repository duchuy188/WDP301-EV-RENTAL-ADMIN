import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  MapPin, 
  User, 
  Phone, 
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Settings,
  X,
  Loader2
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { showToast } from '../lib/toast';
import { EnhancedDataTable, EnhancedColumn } from '../components/EnhancedDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import { AssignmentModal } from '../components/AssignmentModal';
import { StaffManagementModal } from '../components/StaffManagementModal';
import { AssignmentService, UnassignedStaff, UnassignedStaffParams } from '../components/service/assignmentService';
import { formatDate } from '../utils/dateUtils';

export default function Assignment() {
  const [staff, setStaff] = useState<UnassignedStaff[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<UnassignedStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [filters, setFilters] = useState<UnassignedStaffParams>({
    page: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500); // Debounce search với 1500ms
  const [selectedStaff, setSelectedStaff] = useState<UnassignedStaff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Global statistics (không đổi theo filter/search)
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    unassigned: 0,
    assigned: 0,
  });

  // Helper function to fetch global stats
  const fetchGlobalStats = useCallback(async () => {
    try {
      // Fetch total staff (unassigned + assigned)
      const { UserService } = await import('../components/service/userService');
      const allStaffResponse = await UserService.getUsersByRole('Station Staff', { 
        page: 1, 
        limit: 999 
      });
      
      // Count assigned (có stationId)
      const assignedCount = allStaffResponse.users.filter((s: any) => s.stationId).length;
      const totalCount = allStaffResponse.pagination.total;
      const unassignedCount = totalCount - assignedCount;
      
      const stats = {
        total: totalCount,
        unassigned: unassignedCount,
        assigned: assignedCount,
      };
      
      setGlobalStats(stats);
      console.log('📊 Global Assignment Statistics:', stats);
      
      return stats;
    } catch (err) {
      console.error('❌ Error fetching global assignment stats:', err);
    }
  }, []);

  // Fetch global statistics on mount
  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Fetch unassigned staff
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AssignmentService.getUnassignedStaff({
        ...filters,
        search: debouncedSearchQuery || undefined,
      });
      
      setStaff(response.staff);
      setPagination(response.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách nhân viên';
      setError(errorMessage);
      showToast.error(errorMessage);
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned staff (nhân viên đã phân công)
  const fetchAssignedStaff = async () => {
    try {
      setLoadingAssigned(true);
      const { UserService } = await import('../components/service/userService');
      const response = await UserService.getUsersByRole('Station Staff', {
        page: 1,
        limit: 999 // Get all assigned staff
      });
      
      // Filter only staff that have stationId (đã được phân công) and map to UnassignedStaff format
      const staffWithStation = response.users
        .filter((user: any) => user.stationId)
        .map((user: any) => ({
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          status: user.status,
          role: user.role,
          stationId: user.stationId,
          kyc_status: user.kycStatus || 'not_submitted',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
      
      setAssignedStaff(staffWithStation);
      console.log('📋 Assigned staff:', staffWithStation);
    } catch (err: any) {
      console.error('Error fetching assigned staff:', err);
    } finally {
      setLoadingAssigned(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchStaff();
  }, [filters, debouncedSearchQuery]);

  // Memoized handlers
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleAssignmentSuccess = useCallback(() => {
    setSuccessMessage('Phân công nhân viên thành công!');
    fetchStaff(); // Refresh unassigned list
    fetchAssignedStaff(); // Refresh assigned list
    fetchGlobalStats(); // Refresh global stats
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [fetchGlobalStats]);

  const handleOpenManagementModal = useCallback(() => {
    fetchAssignedStaff(); // Fetch assigned staff when opening modal
    setIsManagementModalOpen(true);
  }, []);

  const handleAssignStaff = useCallback((staffMember: UnassignedStaff) => {
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  }, []);

  // Table columns
  const columns: EnhancedColumn[] = [
    {
      key: 'fullname',
      header: 'Tên nhân viên',
      sortable: true,
      filterable: true,
      render: (value: string, row: UnassignedStaff) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      sortable: true,
      filterable: true,
      render: (value: any) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Vai trò',
      sortable: true,
      filterable: true,
      render: (value: any) => (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      render: (value: any) => (
        <Badge 
          variant={value === 'active' ? 'success' : 'secondary'}
          className="text-xs"
        >
          {value === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      filterable: false,
      render: (value: any) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {formatDate(value)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      sortable: false,
      filterable: false,
      render: (_: any, row: UnassignedStaff) => (
        <Button
          size="sm"
          onClick={() => handleAssignStaff(row)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MapPin className="w-4 h-4 mr-1" />
          Phân công
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
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
              Phân công nhân viên
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Quản lý và phân công nhân viên vào các trạm
            </p>
          </div>
          <Button
            onClick={fetchStaff}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 dark:text-green-400">{successMessage}</span>
        </motion.div>
      )}

      {/* Stats Cards - Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tổng nhân viên
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {globalStats.total}
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse shadow-sm" />
                  <span>{globalStats.assigned} đã phân công</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Chưa phân công
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                {globalStats.unassigned}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Cần phân công vào trạm
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Đã phân công
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {globalStats.assigned}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {globalStats.total > 0 ? Math.round((globalStats.assigned / globalStats.total) * 100) : 0}% tổng số
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search with Clear Button & Debounce Loading */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input
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
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {filters.limit} / trang
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <EnhancedDataTable
        title="Danh sách nhân viên chưa phân công"
        columns={columns}
        data={staff}
        loading={loading}
        searchable={false}
        exportable={true}
        selectable={false}
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        emptyMessage="Không có nhân viên chưa phân công"
        customActions={
          <Button
            onClick={handleOpenManagementModal}
            disabled={loadingAssigned}
            className="group flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            size="sm"
          >
            <Settings className={`h-5 w-5 ${loadingAssigned ? 'animate-spin' : 'group-hover:rotate-90 transition-transform duration-200'}`} />
            <span className="font-semibold">Quản lý phân công</span>
          </Button>
        }
      />

      {/* Professional Pagination */}
      {!loading && pagination.pages > 1 && (
        <ProfessionalPagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(limit) => {
            setFilters(prev => ({ ...prev, limit, page: 1 }));
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          loading={loading}
          itemsLabel="nhân viên"
        />
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staff={selectedStaff}
        onSuccess={handleAssignmentSuccess}
      />

      {/* Staff Management Modal - For assigned staff only */}
      <StaffManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        staff={assignedStaff}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}




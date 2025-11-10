import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserCog, MapPin, Star, Activity, Loader2, User as UserIcon, UserPlus, Filter, X, RefreshCw, Search, RotateCcw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { EnhancedDataTable, EnhancedColumn } from '../components/EnhancedDataTable';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import { UserService } from '../components/service/userService';
import { stationService } from '../components/service/stationService';
import { User } from '../components/service/type/userTypes';
import { Station } from '../components/service/type/stationTypes';
import { CreateStaffModal } from '../components/CreateStaffModal';
import { showToast } from '../lib/toast';

export function Staff() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filter states
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [loadingStations, setLoadingStations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500); // Debounce search với 600ms
  
  // Global statistics (không đổi theo filter/search)
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    assigned: 0,
  });

  // Helper function to fetch global stats
  const fetchGlobalStats = useCallback(async () => {
    try {
      // Parallel fetch để tối ưu performance
      const [totalResponse, activeResponse, suspendedResponse] = await Promise.all([
        UserService.getUsersByRole('Station Staff', { page: 1, limit: 1 }),
        UserService.getUsersByRole('Station Staff', { page: 1, limit: 1, status: 'active' }),
        UserService.getUsersByRole('Station Staff', { page: 1, limit: 1, status: 'suspended' }),
      ]);
      
      // Fetch all staff để đếm assigned (có stationId)
      const allStaffResponse = await UserService.getUsersByRole('Station Staff', { page: 1, limit: 999 });
      const assignedCount = allStaffResponse.users.filter((s: User) => s.stationId).length;
      
      const stats = {
        total: totalResponse.pagination.total,
        active: activeResponse.pagination.total,
        suspended: suspendedResponse.pagination.total,
        assigned: assignedCount,
      };
      
      setGlobalStats(stats);
      console.log('📊 Global Staff Statistics:', stats);
      
      return stats;
    } catch (err) {
      console.error('❌ Error fetching global staff stats:', err);
    }
  }, []);

  // Fetch stations and global stats on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingStations(true);
        
        // Parallel fetch stations and global stats
        const [stationsResponse] = await Promise.all([
          stationService.getStations({ page: 1, limit: 999 }),
          fetchGlobalStats(),
        ]);
        
        console.log('🏢 Loaded stations for filter:', stationsResponse.stations?.length || 0);
        setStations(stationsResponse.stations || []);
      } catch (err: any) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchInitialData();
  }, [fetchGlobalStats]);

  // Fetch staff data from API
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If a station is selected, fetch staff by station
        if (selectedStationId) {
          const response = await stationService.getStationStaff(selectedStationId);
          
          // Debug log to see response structure
          console.log('🔍 Station Staff Response:', response);
          console.log('🔍 Response data:', response.data);
          
          // Handle different response structures
          let staffArray: any[] = [];
          
          // Try multiple possible response structures
          if (response.data?.staff) {
            staffArray = response.data.staff;
          } else if (Array.isArray(response.data)) {
            staffArray = response.data;
          } else if ((response as any).staff) {
            staffArray = (response as any).staff;
          } else if (Array.isArray(response)) {
            staffArray = response as any[];
          }
          
          console.log('📊 Staff array:', staffArray);
          
          // Transform station staff data to match User interface
          let staffData = staffArray.map((s: any) => ({
            _id: s._id,
            fullname: s.fullname,
            email: s.email,
            phone: s.phone,
            avatar: s.avatar,
            role: s.role,
            status: s.status,
            stationId: s.stationId,
            kycStatus: s.kyc_status || s.kycStatus || 'not_submitted',
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
          }));
          
          // Apply search filter
          if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase().trim();
            staffData = staffData.filter((s: User) => 
              s.fullname?.toLowerCase().includes(query) ||
              s.email?.toLowerCase().includes(query) ||
              s.phone?.toLowerCase().includes(query)
            );
          }
          
          console.log('✅ Transformed staff data:', staffData);
          
          setStaff(staffData);
          setPagination({
            total: staffData.length,
            page: 1,
            limit: pagination.limit,
            pages: Math.ceil(staffData.length / pagination.limit)
          });
        } else {
          // Fetch all staff
          const response = await UserService.getUsersByRole('Station Staff', {
            page: pagination.page,
            limit: pagination.limit,
            sort: 'createdAt',
            search: debouncedSearchQuery.trim() || undefined
          });
          setStaff(response.users);
          setPagination(response.pagination);
        }
      } catch (err: any) {
        console.error('Error fetching staff:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách nhân viên';
        setError(errorMessage);
        showToast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [pagination.page, pagination.limit, selectedStationId, refreshTrigger, debouncedSearchQuery]);

  const columns: EnhancedColumn[] = [
    {
      key: 'stt',
      header: 'STT',
      sortable: false,
      filterable: false,
      render: (_value: any, _row: User, index?: number) => {
        const currentPage = pagination.page || 1;
        const limit = pagination.limit || 10;
        const stt = (currentPage - 1) * limit + (index ?? 0) + 1;
        return (
          <span className="font-medium text-sm text-gray-600 dark:text-gray-400">{stt}</span>
        );
      }
    },
    {
      key: 'fullname',
      header: 'Tên nhân viên',
      sortable: true,
      filterable: true,
      render: (value: any, row: User) => (
        <div className="flex items-center space-x-3 min-w-[220px]">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
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
            <UserIcon className={`h-5 w-5 text-white ${row.avatar ? 'hidden' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.email}</p>
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
          <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
          <span className="font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'stationId',
      header: 'Trạm thuê xe',
      sortable: false,
      filterable: false,
      render: (value: any) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-gray-900 dark:text-white">
            {value && typeof value === 'object' 
              ? `${value.name || value.code || 'Unknown Station'}` 
              : value || 'Chưa phân công'
            }
          </span>
        </div>
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
          className="whitespace-nowrap"
        >
          {value === 'active' ? 'Hoạt động' : 'Đã khóa'}
        </Badge>
      )
    }
  ];

  // Use global statistics (không thay đổi theo filter/search)
  const totalStaff = globalStats.total;
  const activeStaff = globalStats.active;
  const suspendedStaff = globalStats.suspended;
  const assignedStaff = globalStats.assigned;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Handle staff creation success
  const handleStaffCreated = () => {
    // Clear filter and refresh the staff list
    setSelectedStationId('');
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Refresh global stats
    fetchGlobalStats();
    
    // Toast đã được show từ CreateStaffModal rồi, không cần show thêm
  };

  // Memoized handlers
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedStationId('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  return (
    <div className="space-y-6 p-6">
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
              Quản lý nhân viên
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Quản lý và phân công nhân viên vào các trạm
            </p>
          </div>
          <Button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </motion.div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                <UserCog className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {totalStaff}
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse shadow-sm" />
                  <span>{activeStaff} đang làm việc</span>
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Đang làm việc
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {activeStaff}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0}% tổng số
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Đã phân công
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                {assignedStaff}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {totalStaff - assignedStaff} chưa phân công
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Bị khóa
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
                {suspendedStaff}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Tài khoản bị tạm khóa
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search & Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              {/* Search Bar with Clear Button & Debounce Loading */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11"
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

              {/* Filter by Station */}
              <div className="flex items-center gap-3">
                <div className="relative w-full lg:w-72">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <select
                    value={selectedStationId}
                    onChange={(e) => {
                      setSelectedStationId(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    disabled={loadingStations}
                    title="Chọn trạm để lọc nhân viên"
                    aria-label="Chọn trạm để lọc nhân viên"
                    className="w-full h-11 pl-10 pr-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                  >
                    <option value="">
                      {loadingStations ? 'Đang tải trạm...' : 'Tất cả trạm'}
                    </option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
                        {station.name} - {station.district}, {station.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters - Smart button chỉ hiện khi có filter */}
                {(selectedStationId || searchQuery) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="h-11 px-4 flex items-center gap-2"
                      title="Đặt lại bộ lọc"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="hidden xl:inline">Đặt lại</span>
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Staff Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Đang tải dữ liệu nhân viên...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">Lỗi khi tải dữ liệu</p>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Enhanced Data Table with Custom Actions */}
          <div className="relative">
            <EnhancedDataTable
              title={selectedStationId 
                ? `Danh sách nhân viên - ${stations.find(s => s._id === selectedStationId)?.name || ''}` 
                : "Danh sách nhân viên"
              }
              columns={columns}
              data={staff}
              loading={loading}
              searchable={false}
              exportable={true}
              selectable={false}
              pageSize={staff.length}
              pageSizeOptions={[10, 25, 50, 100]}
              emptyMessage="Không có nhân viên nào"
              customActions={
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  size="sm"
                >
                  <UserPlus className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                  <span className="font-semibold">Tạo nhân viên mới</span>
                </Button>
              }
            />
          </div>
          
          {/* Professional Pagination */}
          {pagination.pages > 1 && (
            <ProfessionalPagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              pageSizeOptions={[5, 10, 20, 50]}
              loading={loading}
              itemsLabel="nhân viên"
            />
          )}
        </>
      )}

      {/* Create Staff Modal */}
      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleStaffCreated}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, MapPin, Star, Activity, Loader2, User as UserIcon, UserPlus, Filter, X, RefreshCw, Search } from 'lucide-react';
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

  // Fetch stations for filter
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const response = await stationService.getStations({ page: 1, limit: 999 });
        console.log('🏢 Loaded stations for filter:', response.stations?.length || 0);
        setStations(response.stations || []);
      } catch (err: any) {
        console.error('Error fetching stations:', err);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, []);

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
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
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
            search: searchQuery.trim() || undefined
          });
          setStaff(response.users);
          setPagination(response.pagination);
        }
      } catch (err: any) {
        console.error('Error fetching staff:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách nhân viên';
        setError(errorMessage);
        showToast.error(`Lỗi tải dữ liệu: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [pagination.page, pagination.limit, selectedStationId, refreshTrigger]);

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

  // Calculate statistics based on current view (filtered or all)
  const totalStaff = selectedStationId ? staff.length : pagination.total;
  const activeStaff = staff.filter(s => s.status === 'active').length;
  const suspendedStaff = staff.filter(s => s.status === 'suspended').length;
  const assignedStaff = staff.filter(s => s.stationId !== null && s.stationId !== undefined).length;

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
    
    // The useEffect will automatically refetch when selectedStationId changes
    showToast.success('Nhân viên mới đã được tạo thành công!');
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStationId('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

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
              Theo dõi hiệu suất và quản lý đội ngũ nhân viên
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng nhân viên
              </CardTitle>
              <UserCog className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalStaff}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang làm việc
              </CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeStaff}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đã phân công
              </CardTitle>
              <MapPin className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {assignedStaff}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bị khóa
              </CardTitle>
              <Activity className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {suspendedStaff}
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
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-11"
                />
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

                <Button 
                  onClick={handleSearch} 
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm
                </Button>

                {(selectedStationId || searchQuery) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="h-11 px-4 flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all whitespace-nowrap"
                      title="Xóa bộ lọc"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden xl:inline">Xóa bộ lọc</span>
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Result Badge */}
            {(selectedStationId || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 w-fit"
              >
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Tìm thấy <strong>{staff.length}</strong> nhân viên
                  {selectedStationId && <span className="ml-1">tại {stations.find(s => s._id === selectedStationId)?.name}</span>}
                </span>
              </motion.div>
            )}
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
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tạo nhân viên mới
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
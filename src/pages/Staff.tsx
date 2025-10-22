import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, MapPin, Star, Activity, Loader2, ChevronLeft, ChevronRight, User as UserIcon, UserPlus, Filter, X } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UserService } from '../components/service/userService';
import { stationService } from '../components/service/stationService';
import { User, Station as UserStation } from '../components/service/type/userTypes';
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
  
  // Filter states
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [loadingStations, setLoadingStations] = useState(false);

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
          const staffData = staffArray.map((s: any) => ({
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
            sort: 'createdAt'
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
  }, [pagination.page, pagination.limit, selectedStationId]);

  const columns = [
    {
      key: 'stt',
      header: 'STT',
      render: (_value: any, _row: any, index?: number) => {
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
      render: (value: string, row: any) => (
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
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
          <span className="font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'stationId',
      header: 'Trạm thuê xe',
      render: (value: string | UserStation | null) => (
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
      render: (value: string) => (
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

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý nhân viên
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theo dõi hiệu suất và quản lý đội ngũ nhân viên
        </p>
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

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lọc theo trạm:</span>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedStationId}
                    onChange={(e) => {
                      setSelectedStationId(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    disabled={loadingStations}
                    title="Chọn trạm để lọc nhân viên"
                    aria-label="Chọn trạm để lọc nhân viên"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                {selectedStationId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStationId('')}
                      className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Xóa lọc</span>
                    </Button>
                  </motion.div>
                )}
              </div>

              {selectedStationId && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {staff.length} nhân viên
                  </span>
                </motion.div>
              )}
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
          {/* Staff List Header with Create Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Danh sách nhân viên
              </h2>
              {selectedStationId && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Trạm: <span className="font-medium text-blue-600 dark:text-blue-400">
                    {stations.find(s => s._id === selectedStationId)?.name || 'Đang tải...'}
                  </span>
                </p>
              )}
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 transition-all duration-200 hover:scale-105 shadow-md"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tạo nhân viên mới
            </Button>
          </div>
          
          {/* Table Wrapper with Horizontal Scroll */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={staff}
              />
            </div>
          </div>
          
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} nhân viên
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      title="Chọn số lượng nhân viên hiển thị trên mỗi trang"
                    >
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                    </select>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="px-3 py-1 text-sm">
                        Trang {pagination.page} / {pagination.pages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, MapPin, Star, Activity, Loader2, ChevronLeft, ChevronRight, User as UserIcon, UserPlus } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UserService } from '../components/service/userService';
import { User, Station } from '../components/service/type/userTypes';
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

  // Fetch staff data from API
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await UserService.getUsersByRole('Station Staff', {
          page: pagination.page,
          limit: pagination.limit,
          sort: 'createdAt'
        });
        setStaff(response.users);
        setPagination(response.pagination);
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
  }, [pagination.page, pagination.limit]);

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
            <UserIcon className={`h-4 w-4 text-gray-500 ${row.avatar ? 'hidden' : ''}`} />
          </div>
          <div>
            <span className="font-medium">{value}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'stationId',
      header: 'Điểm thuê',
      render: (value: string | Station | null) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>
            {value && typeof value === 'object' 
              ? `${value.name || value.code || 'Unknown Station'}` 
              : value || 'Chưa phân công'
            }
          </span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-green-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value === 'active' ? 'Đang làm việc' : 'Nghỉ'}
        </Badge>
      )
    }
  ];

  const totalStaff = pagination.total;
  const activeStaff = staff.filter(s => s.status === 'active').length;
  const suspendedStaff = staff.filter(s => s.status === 'suspended').length;
  const kycApproved = staff.filter(s => s.kycStatus === 'approved').length;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Handle staff creation success
  const handleStaffCreated = () => {
    // Refresh the staff list
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await UserService.getUsersByRole('Station Staff', {
          page: pagination.page,
          limit: pagination.limit,
          sort: 'createdAt'
        });
        setStaff(response.users);
        setPagination(response.pagination);
        console.log('✅ Staff list refreshed successfully');
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
                Đã xác thực KYC
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {kycApproved}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Danh sách nhân viên
            </h2>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 transition-all duration-200 hover:scale-105 shadow-md"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tạo nhân viên mới
            </Button>
          </div>
          
          <DataTable
            columns={columns}
            data={staff}
          />
          
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
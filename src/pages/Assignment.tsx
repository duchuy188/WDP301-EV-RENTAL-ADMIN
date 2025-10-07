import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  MapPin, 
  User, 
  Phone, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AssignmentModal } from '../components/AssignmentModal';
import { AssignmentService, UnassignedStaff, UnassignedStaffParams } from '../components/service/assignmentService';

export default function Assignment() {
  const [staff, setStaff] = useState<UnassignedStaff[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedStaff, setSelectedStaff] = useState<UnassignedStaff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch unassigned staff
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AssignmentService.getUnassignedStaff({
        ...filters,
        search: searchQuery || undefined,
      });
      
      setStaff(response.staff);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhân viên');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchStaff();
  }, [filters, searchQuery]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle assignment success
  const handleAssignmentSuccess = () => {
    setSuccessMessage('Phân công nhân viên thành công!');
    fetchStaff(); // Refresh the list
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle assign staff
  const handleAssignStaff = (staffMember: UnassignedStaff) => {
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      key: 'fullname',
      header: 'Tên nhân viên',
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
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (value: string) => (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value: string) => (
        <Badge 
          variant={value === 'active' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {value === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      )
    },
    {
      key: 'kyc_status',
      header: 'KYC',
      render: (value: string) => (
        <Badge 
          variant={value === 'approved' ? 'default' : 'destructive'}
          className="text-xs"
        >
          {value === 'approved' ? 'Đã duyệt' : 'Chưa duyệt'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString('vi-VN')}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Phân công nhân viên
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý và phân công nhân viên vào các trạm
          </p>
        </div>
        <Button
          onClick={fetchStaff}
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng nhân viên
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pagination.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chưa phân công
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {staff.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đã phân công
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pagination.total - staff.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
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
      <DataTable
        title="Danh sách nhân viên chưa phân công"
        columns={columns}
        data={staff}
        loading={loading}
      />

      {/* Pagination */}
      {!loading && staff.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} nhân viên
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Trang {pagination.page} / {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}




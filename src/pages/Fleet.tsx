import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  Plus, 
  Search, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  Grid3X3,
  List,
  Map
} from 'lucide-react';
import { EnhancedDataTable, EnhancedColumn } from '../components/EnhancedDataTable';
import { VehicleCardGrid } from '../components/VehicleCardGrid';
import { VehicleMapView } from '../components/VehicleMapView';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EditVehicleModal } from '../components/EditVehicleModal';
import { BulkVehicleModal } from '../components/BulkVehicleModal';
import { VehicleAssignmentModal } from '../components/VehicleAssignmentModal';
import { vehicleService } from '../components/service/vehicleService';
import { formatVehicleStatus, getVehicleStatusColor } from '../components/service/utils/apiUtils';
import { BatteryIndicator } from '../components/ui/battery-indicator';
import type { VehicleUI, VehicleStatistics, VehicleStatus, VehicleType } from '../components/service/type/vehicleTypes';

export function Fleet() {
  const [vehicles, setVehicles] = useState<VehicleUI[]>([]);
  const [statistics, setStatistics] = useState<VehicleStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<VehicleType | null>(null);
  const [batteryFilter] = useState<{ min: number; max: number } | null>(null);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkModalDefaultTab, setBulkModalDefaultTab] = useState<'bulk-create' | 'import-plates' | 'pricing'>('bulk-create');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleUI | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');

  // Load data
  useEffect(() => {
    loadVehicles();
    loadStatistics();
  }, []);

  // Reload vehicles when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadVehicles();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, typeFilter, batteryFilter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehiclesForAdmin({
        page: 1,
        limit: 100,
        search: searchTerm,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        batteryLevelMin: batteryFilter?.min,
        batteryLevelMax: batteryFilter?.max
      });
      // Log only in development mode
      if (import.meta.env.DEV) {
        console.log('Fleet: Received vehicles response:', response);
        console.log('Fleet: Response data type:', typeof response.data);
        console.log('Fleet: Response data length:', response.data?.length);
        console.log('Fleet: First vehicle:', response.data?.[0]);
      }
      
      const vehiclesData = response.data || [];
      setVehicles(vehiclesData);
      
      // Check if this is mock data (in development)
      if (vehiclesData.length > 0 && vehiclesData[0].id?.startsWith('mock-')) {
        setIsUsingMockData(true);
      } else {
        setIsUsingMockData(false);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      
      // Try to get mock data in development mode
      if (import.meta.env.DEV) {
        try {
          console.log('Attempting to load mock data...');
          const mockResponse = await vehicleService.getMockVehicles();
          console.log('Mock data loaded:', mockResponse);
          setVehicles(mockResponse.data);
          setIsUsingMockData(true);
        } catch (mockError) {
          console.error('Failed to load mock data:', mockError);
          setVehicles([]);
          setIsUsingMockData(false);
        }
      } else {
        // Set empty array on error to prevent UI issues
        setVehicles([]);
        setIsUsingMockData(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await vehicleService.getVehicleStatistics();
      setStatistics(response.data || null);
    } catch (error) {
      console.error('Error loading statistics:', error);
      
      // If using mock data, calculate statistics from mock vehicles
      if (isUsingMockData && vehicles.length > 0) {
        const mockStats = {
          totalVehicles: vehicles.length,
          availableVehicles: vehicles.filter(v => v.status === 'available').length,
          rentedVehicles: vehicles.filter(v => v.status === 'rented').length,
          maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
          brokenVehicles: vehicles.filter(v => v.status === 'broken').length,
          averageBatteryLevel: Math.round(vehicles.reduce((sum, v) => sum + v.batteryLevel, 0) / vehicles.length),
          stationsWithVehicles: new Set(vehicles.filter(v => v.stationId).map(v => v.stationId)).size,
          totalStations: 3 // Mock total stations
        };
        setStatistics(mockStats);
      } else {
        // Set default statistics if API fails
        setStatistics({
          totalVehicles: 0,
          availableVehicles: 0,
          rentedVehicles: 0,
          maintenanceVehicles: 0,
          brokenVehicles: 0,
          averageBatteryLevel: 0,
          stationsWithVehicles: 0,
          totalStations: 0
        });
      }
    }
  };

  // Handle vehicle operations
  const handleEditVehicle = (vehicle: VehicleUI) => {
    setSelectedVehicle(vehicle);
    setEditModalOpen(true);
  };

  const handleDeleteVehicle = async (vehicle: VehicleUI) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa xe ${vehicle.licensePlate}?`)) {
      try {
        await vehicleService.deleteVehicle(vehicle.id);
        loadVehicles();
        loadStatistics();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Có lỗi xảy ra khi xóa xe');
      }
    }
  };

  const handleVehicleUpdated = () => {
    loadVehicles();
    loadStatistics();
  };

  // Handler functions for vehicle actions
  const handleAssignVehicle = (vehicle: VehicleUI) => {
    setSelectedVehicle(vehicle);
    setAssignmentModalOpen(true);
  };

  const handleViewVehicle = (vehicle: VehicleUI) => {
    // For now, just log the vehicle. Can be extended to show detail modal
    console.log('Viewing vehicle:', vehicle);
    // Could open a detail modal here
  };

  const handleBulkAction = (action: string, vehicles: VehicleUI[]) => {
    console.log('Bulk action:', action, 'on vehicles:', vehicles);
    // Handle bulk actions like assign, maintenance, export, etc.
    switch (action) {
      case 'assign':
        // Open bulk assignment modal
        setBulkModalDefaultTab('bulk-create');
        setBulkModalOpen(true);
        break;
      case 'maintenance':
        // Set selected vehicles to maintenance status
        // This would need API implementation
        break;
      case 'export':
        // Export selected vehicles
        setBulkModalDefaultTab('pricing');
        setBulkModalOpen(true);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };


  // Filter vehicles
  const filteredVehicles = (vehicles || []).filter(vehicle => {
    const matchesSearch = !searchTerm || 
      vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || vehicle.status === statusFilter;
    const matchesType = !typeFilter || vehicle.type === typeFilter;
    
    const matchesBattery = !batteryFilter || 
      (vehicle.batteryLevel >= batteryFilter.min && vehicle.batteryLevel <= batteryFilter.max);
    
    return matchesSearch && matchesStatus && matchesType && matchesBattery;
  });

  // Log filtered vehicles in development mode
  if (import.meta.env.DEV && filteredVehicles.length > 0) {
    console.log('Fleet: Filtered vehicles count:', filteredVehicles.length);
  }

  const vehicleColumns: EnhancedColumn[] = [
    {
      key: 'vehicleInfo',
      header: 'Thông tin xe',
      sortable: true,
      filterable: true,
      render: (_value: any, row: VehicleUI) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Car className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.licensePlate}</div>
            <div className="text-sm text-gray-500">{row.brand} {row.model} ({row.year})</div>
            <div className="text-xs text-gray-400">
              {row.name} • {row.type === 'scooter' ? 'Xe máy điện' : 'Mô tô điện'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'batteryLevel',
      header: 'Pin (%)',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <BatteryIndicator level={value} />
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      render: (value: VehicleStatus) => {
        const statusConfig = getVehicleStatusColor(value);
        return (
          <Badge className={statusConfig}>
            {formatVehicleStatus(value)}
          </Badge>
        );
      }
    },
    {
      key: 'location',
      header: 'Vị trí',
      render: (_value: any, row: VehicleUI) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-sm text-gray-900">{row.stationName || 'Chưa phân bổ'}</div>
            {row.stationId && (
              <div className="text-xs text-gray-500">Trạm: {String(row.stationId).slice(0, 8)}...</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'specifications',
      header: 'Thông số',
      render: (_value: any, row: VehicleUI) => (
        <div className="text-sm">
          <div className="text-gray-900">Màu: {row.color}</div>
          <div className="text-gray-500">Tầm xa: {row.maxRange}km</div>
          <div className="text-gray-500">Pin: {row.batteryCapacity}kWh</div>
        </div>
      )
    },
    {
      key: 'pricing',
      header: 'Giá thuê',
      render: (_value: any, row: VehicleUI) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {row.pricePerDay.toLocaleString('vi-VN')} VNĐ/ngày
          </div>
          <div className="text-gray-500">
            Cọc: {row.depositPercentage}%
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString('vi-VN')}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (_value: any, row: VehicleUI) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEditVehicle(row)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Sửa
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteVehicle(row)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Xóa
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Network Status Banner */}
      {isUsingMockData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Chế độ phát triển - Sử dụng dữ liệu mẫu
              </p>
              <p className="text-xs text-yellow-700">
                Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu để phát triển.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quản lý đội xe
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Theo dõi và quản lý toàn bộ đội xe điện
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => {
                setBulkModalDefaultTab('import-plates');
                setBulkModalOpen(true);
              }}
            >
              <Upload className="h-4 w-4" />
              <span>Import Biển số</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => {
                setBulkModalDefaultTab('pricing');
                setBulkModalOpen(true);
              }}
            >
              <Download className="h-4 w-4" />
              <span>Cập nhật Giá</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => setAssignmentModalOpen(true)}
            >
              <Users className="h-4 w-4" />
              <span>Phân bổ xe</span>
            </Button>
            <Button 
              className="flex items-center space-x-2"
              onClick={() => {
                setBulkModalDefaultTab('bulk-create');
                setBulkModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Tạo hàng loạt</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Fleet Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng số xe
              </CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics?.totalVehicles || 0}
              </div>
              <p className="text-xs text-gray-500">
                {statistics?.averageBatteryLevel || 0}% pin trung bình
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Xe sẵn sàng
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics?.availableVehicles || 0}
              </div>
              <p className="text-xs text-gray-500">
                {statistics?.stationsWithVehicles || 0} trạm có xe
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Xe đang thuê
              </CardTitle>
              <Car className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics?.rentedVehicles || 0}
              </div>
              <p className="text-xs text-gray-500">
                Đang được sử dụng
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cần bảo trì
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(statistics?.maintenanceVehicles || 0) + (statistics?.brokenVehicles || 0)}
              </div>
              <p className="text-xs text-gray-500">
                {statistics?.maintenanceVehicles || 0} bảo trì, {statistics?.brokenVehicles || 0} hỏng
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo biển số, model, brand..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadVehicles();
                    loadStatistics();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                {import.meta.env.DEV && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const mockData = vehicleService.getMockVehicles();
                      setVehicles(mockData.data);
                      setIsUsingMockData(true);
                      
                      // Calculate mock statistics
                      const mockStats = {
                        totalVehicles: mockData.data.length,
                        availableVehicles: mockData.data.filter(v => v.status === 'available').length,
                        rentedVehicles: mockData.data.filter(v => v.status === 'rented').length,
                        maintenanceVehicles: mockData.data.filter(v => v.status === 'maintenance').length,
                        brokenVehicles: mockData.data.filter(v => v.status === 'broken').length,
                        averageBatteryLevel: Math.round(mockData.data.reduce((sum, v) => sum + v.batteryLevel, 0) / mockData.data.length),
                        stationsWithVehicles: new Set(mockData.data.filter(v => v.stationId).map(v => v.stationId)).size,
                        totalStations: 3
                      };
                      setStatistics(mockStats);
                    }}
                  >
                    Dữ liệu mẫu
                  </Button>
                )}
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                >
                  Tất cả
                </Button>
                <Button
                  variant={statusFilter === 'available' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter('available')}
                >
                  Sẵn sàng
                </Button>
                <Button
                  variant={statusFilter === 'rented' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter('rented')}
                >
                  Đang thuê
                </Button>
                <Button
                  variant={statusFilter === 'maintenance' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter('maintenance')}
                >
                  Bảo trì
                </Button>
                <Button
                  variant={statusFilter === 'broken' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter('broken')}
                >
                  Hỏng
                </Button>
                
                {/* Divider */}
                <div className="w-px h-6 bg-gray-300"></div>
                
                {/* Vehicle Type Filters */}
                <Button
                  variant={typeFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(null)}
                >
                  Tất cả loại
                </Button>
                <Button
                  variant={typeFilter === 'scooter' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter('scooter')}
                >
                  Xe máy điện
                </Button>
                <Button
                  variant={typeFilter === 'motorcycle' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter('motorcycle')}
                >
                  Mô tô điện
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Danh sách xe ({filteredVehicles.length})
                </h3>
                {isUsingMockData && (
                  <Badge variant="secondary" className="text-xs">
                    Dữ liệu demo
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Chế độ xem:</span>
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-8 px-3"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Card
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    className="h-8 px-3"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    className="h-8 px-3"
                    onClick={() => setViewMode('map')}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Map
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicle Views */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        {viewMode === 'grid' ? (
          <VehicleCardGrid
            vehicles={filteredVehicles}
            loading={loading}
            onEdit={handleEditVehicle}
            onAssign={handleAssignVehicle}
            onView={handleViewVehicle}
            onAddNew={() => setBulkModalOpen(true)}
            onImport={() => {
              setBulkModalDefaultTab('import-plates');
              setBulkModalOpen(true);
            }}
            onExport={() => {
              setBulkModalDefaultTab('pricing');
              setBulkModalOpen(true);
            }}
            onBulkAction={handleBulkAction}
          />
        ) : viewMode === 'table' ? (
          <EnhancedDataTable
            title={`Danh sách xe (${filteredVehicles.length})`}
            columns={vehicleColumns}
            data={filteredVehicles}
            loading={loading}
            searchable={true}
            exportable={true}
            selectable={true}
            pageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            onRowClick={handleViewVehicle}
            emptyMessage="Không có xe nào"
          />
        ) : (
          <VehicleMapView
            vehicles={filteredVehicles}
            loading={loading}
            onVehicleClick={handleViewVehicle}
          />
        )}
      </motion.div>

      {/* Modals */}
      <EditVehicleModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onVehicleUpdated={handleVehicleUpdated}
      />

      <BulkVehicleModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={handleVehicleUpdated}
        defaultTab={bulkModalDefaultTab}
      />

      <VehicleAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        onSuccess={handleVehicleUpdated}
      />
    </div>
  );
}
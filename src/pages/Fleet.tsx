import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  Plus, 
  Search, 
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Users,
  Grid3X3,
  List,
  Map,
  Filter,
  X
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
import { LicensePlateModal } from '../components/LicensePlateModal';
import { BulkPricingModal } from '../components/BulkPricingModal';
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
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'battery' | 'price' | 'year'>('name');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [licensePlateModalOpen, setLicensePlateModalOpen] = useState(false);
  const [bulkPricingModalOpen, setBulkPricingModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleUI | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'map'>('table');

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
          draftVehicles: vehicles.filter(v => v.status === 'draft').length,
          availableVehicles: vehicles.filter(v => v.status === 'available').length,
          reservedVehicles: vehicles.filter(v => v.status === 'reserved').length,
          rentedVehicles: vehicles.filter(v => v.status === 'rented').length,
          maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
          averageBatteryLevel: Math.round(vehicles.reduce((sum, v) => sum + v.batteryLevel, 0) / vehicles.length),
          stationsWithVehicles: new Set(vehicles.filter(v => v.stationId).map(v => v.stationId)).size,
          totalStations: 3 // Mock total stations
        };
        setStatistics(mockStats);
      } else {
        // Set default statistics if API fails
        setStatistics({
          totalVehicles: 0,
          draftVehicles: 0,
          availableVehicles: 0,
          reservedVehicles: 0,
          rentedVehicles: 0,
          maintenanceVehicles: 0,
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
        setBulkModalOpen(true);
        break;
      case 'maintenance':
        // Set selected vehicles to maintenance status
        // This would need API implementation
        break;
      case 'export':
        // Export selected vehicles - open license plate modal instead
        setLicensePlateModalOpen(true);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };


  // Filter and sort vehicles
  const filteredVehicles = (vehicles || [])
    .filter(vehicle => {
      const matchesSearch = !searchTerm || 
        vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || vehicle.status === statusFilter;
      const matchesType = !typeFilter || vehicle.type === typeFilter;
      
      const matchesBattery = !batteryFilter || 
        (vehicle.batteryLevel >= batteryFilter.min && vehicle.batteryLevel <= batteryFilter.max);
      
      return matchesSearch && matchesStatus && matchesType && matchesBattery;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'battery':
          return b.batteryLevel - a.batteryLevel;
        case 'price':
          return b.pricePerDay - a.pricePerDay;
        case 'year':
          return b.year - a.year;
        case 'name':
        default:
          return (a.name || a.licensePlate).localeCompare(b.name || b.licensePlate);
      }
    });

  // Log filtered vehicles in development mode
  if (import.meta.env.DEV && filteredVehicles.length > 0) {
    console.log('Fleet: Filtered vehicles count:', filteredVehicles.length);
  }

  const vehicleColumns: EnhancedColumn[] = [
    {
      key: 'stt',
      header: 'STT',
      width: '60px',
      render: (_value: any, _row: VehicleUI, index?: number) => (
        <div className="text-center font-medium text-gray-700">
          {(index !== undefined ? index : 0) + 1}
        </div>
      )
    },
    {
      key: 'vehicleInfo',
      header: 'Thông tin xe',
      sortable: true,
      filterable: true,
      render: (_value: any, row: VehicleUI) => (
        <div className="flex items-center space-x-3">
          {/* Vehicle Image */}
          <div className="flex-shrink-0">
            {row.images && row.images.length > 0 ? (
              <img
                src={row.images[0]}
                alt={row.licensePlate}
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-16 h-16 flex items-center justify-center bg-blue-100 rounded-lg border-2 border-gray-200"><svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg></div>';
                  }
                }}
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded-lg border-2 border-gray-200">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </div>
          {/* Vehicle Info */}
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
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(value)}
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
        className="bg-gradient-to-r from-green-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-sm border border-green-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Quản lý đội xe
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                <span>Theo dõi và quản lý toàn bộ đội xe điện của bạn</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 hover:bg-white hover:shadow-md transition-all"
              onClick={() => setLicensePlateModalOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Export/ Import Biển số</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 hover:bg-white hover:shadow-md transition-all"
              onClick={() => setBulkPricingModalOpen(true)}
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Cập nhật Giá</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 hover:bg-white hover:shadow-md transition-all"
              onClick={() => setAssignmentModalOpen(true)}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Phân bổ xe</span>
            </Button>
            <Button 
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              onClick={() => setBulkModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Tạo xe</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Fleet Statistics Cards */}
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
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng số xe
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {statistics?.totalVehicles || 0}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  <span>{statistics?.averageBatteryLevel || 0}% pin TB</span>
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
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Xe sẵn sàng
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {statistics?.availableVehicles || 0}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>{statistics?.stationsWithVehicles || 0} trạm có xe</span>
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 dark:bg-yellow-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Xe đang thuê
              </CardTitle>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {statistics?.rentedVehicles || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đang được sử dụng
              </p>
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
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cần bảo trì
              </CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                {statistics?.maintenanceVehicles || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Xe đang bảo trì
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="space-y-4"
      >
        {/* Search and Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm xe theo tên, biển số, thương hiệu..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Filter Toggle Button */}
          <Button
            variant="outline"
            onClick={() => {
              const newState = !showFilterPanel;
              setShowFilterPanel(newState);
              
              // Scroll to vehicle list when closing filter
              if (!newState) {
                setTimeout(() => {
                  const element = document.getElementById('vehicle-list-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                }, 100);
              }
            }}
            className={`flex items-center space-x-2 h-11 ${
              showFilterPanel 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' 
                : ''
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Bộ lọc</span>
            {showFilterPanel && <X className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence mode="wait">
          {showFilterPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 max-h-[450px] overflow-y-auto custom-scrollbar">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Bộ lọc nâng cao
                  </h3>
                  <div className="flex items-center space-x-2">
                    {(statusFilter || typeFilter || searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter(null);
                          setTypeFilter(null);
                          setSearchTerm('');
                        }}
                        className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilterPanel(false)}
                      className="h-8 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === null}
                        onChange={() => setStatusFilter(null)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Tất cả trạng thái ({vehicles.length})
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === 'draft'}
                        onChange={() => setStatusFilter('draft')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Draft ({statistics?.draftVehicles || 0})
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === 'available'}
                        onChange={() => setStatusFilter('available')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Sẵn sàng ({statistics?.availableVehicles || 0})
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === 'reserved'}
                        onChange={() => setStatusFilter('reserved')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Đã đặt ({statistics?.reservedVehicles || 0})
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === 'rented'}
                        onChange={() => setStatusFilter('rented')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Đang thuê ({statistics?.rentedVehicles || 0})
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === 'maintenance'}
                        onChange={() => setStatusFilter('maintenance')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Bảo trì ({statistics?.maintenanceVehicles || 0})
                      </span>
                    </label>
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loại xe
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={typeFilter === null}
                        onChange={() => setTypeFilter(null)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Tất cả loại
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={typeFilter === 'scooter'}
                        onChange={() => setTypeFilter('scooter')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Xe máy điện
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={typeFilter === 'motorcycle'}
                        onChange={() => setTypeFilter('motorcycle')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mô tô điện
                      </span>
                    </label>
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sắp xếp
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'name'}
                        onChange={() => setSortBy('name')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Tên xe
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'battery'}
                        onChange={() => setSortBy('battery')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mức pin
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'price'}
                        onChange={() => setSortBy('price')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Giá thuê
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'year'}
                        onChange={() => setSortBy('year')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Năm sản xuất
                      </span>
                    </label>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Badge variant="secondary" className="text-xs">
                    {filteredVehicles.length} xe tìm thấy
                  </Badge>
                  {filteredVehicles.length > 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        const element = document.getElementById('vehicle-list-section');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="h-8 px-4 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Xem kết quả
                    </Button>
                  )}
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="border-0 shadow-md bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Danh sách xe
                  </span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    ({filteredVehicles.length})
                  </span>
                </h3>
                {isUsingMockData && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                    📊 Dữ liệu demo
                  </Badge>
                )}
                {(statusFilter || typeFilter || searchTerm) && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                    🔍 Đang lọc
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">
                  Chế độ xem:
                </span>
                <div className="flex items-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
                <Button
                    size="sm"
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    className={`h-9 px-4 rounded-lg transition-all ${
                      viewMode === 'table' 
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Table</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className={`h-9 px-4 rounded-lg transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Card</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    className={`h-9 px-4 rounded-lg transition-all ${
                      viewMode === 'map' 
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setViewMode('map')}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Map</span>
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
        id="vehicle-list-section"
        className="min-h-[400px]"
      >
        {viewMode === 'grid' ? (
          <VehicleCardGrid
            vehicles={filteredVehicles}
            loading={loading}
            onEdit={handleEditVehicle}
            onAssign={handleAssignVehicle}
            onView={handleViewVehicle}
            onBulkAction={handleBulkAction}
          />
        ) : viewMode === 'table' ? (
          <EnhancedDataTable
            columns={vehicleColumns}
            data={filteredVehicles}
            loading={loading}
            searchable={false}
            exportable={false}
            selectable={false}
            pageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            onRowClick={handleViewVehicle}
            emptyMessage="Không có xe nào"
            showInfo={false}
            showColumnSettings={false}
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
      />

      <LicensePlateModal
        isOpen={licensePlateModalOpen}
        onClose={() => setLicensePlateModalOpen(false)}
        onSuccess={handleVehicleUpdated}
        vehicles={vehicles}
      />

      <BulkPricingModal
        isOpen={bulkPricingModalOpen}
        onClose={() => setBulkPricingModalOpen(false)}
        onSuccess={handleVehicleUpdated}
      />

      <VehicleAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        onSuccess={handleVehicleUpdated}
      />
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
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
  Filter,
  X,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { useDebounce } from '../hooks/useDebounce';
import { EnhancedDataTable, EnhancedColumn } from '../components/EnhancedDataTable';
import { VehicleCardGrid } from '../components/VehicleCardGrid';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EditVehicleModal } from '../components/EditVehicleModal';
import { BulkVehicleModal } from '../components/BulkVehicleModal';
import { LicensePlateModal } from '../components/LicensePlateModal';
import { BulkPricingModal } from '../components/BulkPricingModal';
import { VehicleAssignmentModal } from '../components/VehicleAssignmentModal';
import { VehicleDetailModal } from '../components/VehicleDetailModal';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { vehicleService } from '../components/service/vehicleService';
import { formatVehicleStatus, getVehicleStatusColor } from '../components/service/utils/apiUtils';
import { BatteryIndicator } from '../components/ui/battery-indicator';
import { showToast } from '../lib/toast';
import type { VehicleUI, VehicleStatistics, VehicleStatus, VehicleType } from '../components/service/type/vehicleTypes';

export function Fleet() {
  const [vehicles, setVehicles] = useState<VehicleUI[]>([]);
  const [statistics, setStatistics] = useState<VehicleStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1500); // Debounce search với 1500ms
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<VehicleType | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [batteryFilter] = useState<{ min: number; max: number } | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'battery' | 'price' | 'year' | 'createdAt'>('createdAt');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [licensePlateModalOpen, setLicensePlateModalOpen] = useState(false);
  const [bulkPricingModalOpen, setBulkPricingModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleUI | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleUI | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load data
  useEffect(() => {
    loadVehicles();
    loadStatistics();
  }, []);


  // Reload vehicles when debounced search or filters change
  useEffect(() => {
    loadVehicles();
  }, [debouncedSearchTerm, statusFilter, typeFilter, colorFilter, batteryFilter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      
      // Don't send color filter to API - use client-side filtering instead
      // API may not understand Vietnamese color names correctly, so we fetch all
      // vehicles and filter by color on the client side for better accuracy
      
      const response = await vehicleService.getVehiclesForAdmin({
        page: 1,
        limit: 500, // Tăng limit lên 500 để hiển thị đủ tất cả xe
        search: debouncedSearchTerm,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        sort: 'createdAt',
        order: 'desc', // Sort by newest first
        // color: undefined, // Always fetch all colors, filter on client-side
        batteryLevelMin: batteryFilter?.min,
        batteryLevelMax: batteryFilter?.max
      });
      
      let vehiclesData = response.data || [];
      
      // Client-side color filtering as fallback
      if (colorFilter && vehiclesData.length > 0) {
        const colorMap: Record<string, string[]> = {
          'red': ['Đỏ', 'đỏ', 'red', 'Red'],
          'blue': ['Xanh dương', 'xanh dương', 'xanh d', 'blue', 'Blue'],
          'green': ['Xanh lá', 'xanh lá', 'xanh l', 'green', 'Green'],
          'yellow': ['Vàng', 'vàng', 'yellow', 'Yellow'],
          'black': ['Đen', 'đen', 'black', 'Black'],
          'white': ['Trắng', 'trắng', 'white', 'White'],
          'orange': ['Cam', 'cam', 'orange', 'Orange'],
          'purple': ['Tím', 'tím', 'purple', 'Purple'],
          'pink': ['Hồng', 'hồng', 'pink', 'Pink'],
          'gray': ['Xám', 'xám', 'gray', 'grey', 'Gray', 'Grey']
        };
        
        const expectedColors = colorMap[colorFilter] || [colorFilter];
        vehiclesData = vehiclesData.filter(vehicle => {
          const vehicleColor = vehicle.color?.toLowerCase() || '';
          return expectedColors.some(expectedColor => 
            vehicleColor.includes(expectedColor.toLowerCase())
          );
        });
      }
      
      setVehicles(vehiclesData);
      
      // Check if this is mock data (in development)
      if (vehiclesData.length > 0 && vehiclesData[0].id?.startsWith('mock-')) {
        setIsUsingMockData(true);
      } else {
        setIsUsingMockData(false);
      }
    } catch (error) {
      // Set empty array on error to prevent UI issues
      setVehicles([]);
      setIsUsingMockData(false);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await vehicleService.getVehicleStatistics();
      setStatistics(response.data || null);
    } catch (error) {
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

  const handleDeleteVehicle = useCallback((vehicle: VehicleUI) => {
    // Chỉ cho phép xóa xe có status là 'draft'
    if (vehicle.status !== 'draft') {
      showToast.error('Chỉ có thể xóa xe có trạng thái "Chưa gán biển"');
      return;
    }
    setVehicleToDelete(vehicle);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!vehicleToDelete) return;
    
    try {
      setDeleting(true);
      await vehicleService.deleteVehicle(vehicleToDelete.id);
      
      // 1. Close confirmation dialog
      setShowDeleteConfirm(false);
      
      // 2. Show success toast với biển số xe
      showToast.success(`Xóa xe "${vehicleToDelete.licensePlate}" thành công`);
      
      // 3. Reload data
      loadVehicles();
      loadStatistics();
      
      // 4. Reset state
      setVehicleToDelete(null);
      
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Không thể xóa xe');
      // Modal KHÔNG đóng khi lỗi
    } finally {
      setDeleting(false);
    }
  }, [vehicleToDelete]);

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
    setSelectedVehicle(vehicle);
    setViewDetailModalOpen(true);
  };

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleBulkAction = (action: string, vehicles: VehicleUI[]) => {
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
    }
  };


  // Filter and sort vehicles
  const filteredVehicles = (vehicles || [])
    .filter(vehicle => {
      const matchesSearch = !debouncedSearchTerm || 
        vehicle.licensePlate?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        vehicle.brand?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || vehicle.status === statusFilter;
      const matchesType = !typeFilter || vehicle.type === typeFilter;
      const matchesColor = !colorFilter || (() => {
        const vehicleColorLower = vehicle.color.toLowerCase();
        const filterColorLower = colorFilter.toLowerCase();
        
        // Map filter colors to possible vehicle color values
        const colorMappings: { [key: string]: string[] } = {
          'red': ['red', 'đỏ'],
          'blue': ['blue', 'xanh dương', 'xanh d'],
          'green': ['green', 'xanh lá', 'xanh l'],
          'yellow': ['yellow', 'vàng'],
          'black': ['black', 'đen'],
          'white': ['white', 'trắng'],
          'orange': ['orange', 'cam'],
          'purple': ['purple', 'tím'],
          'pink': ['pink', 'hồng'],
          'gray': ['gray', 'grey', 'xám']
        };
        
        const possibleValues = colorMappings[filterColorLower] || [filterColorLower];
        return possibleValues.some(value => vehicleColorLower.includes(value));
      })();
      
      const matchesBattery = !batteryFilter || 
        (vehicle.batteryLevel >= batteryFilter.min && vehicle.batteryLevel <= batteryFilter.max);
      
      return matchesSearch && matchesStatus && matchesType && matchesColor && matchesBattery;
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
          return (a.name || a.licensePlate).localeCompare(b.name || b.licensePlate);
        case 'createdAt':
        default:
          // Sort by newest first (most recent createdAt)
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
      }
    });

  // Log filtered vehicles in development mode
  if (import.meta.env.DEV && filteredVehicles.length > 0) {
  }

  const vehicleColumns: EnhancedColumn[] = [
    {
      key: 'stt',
      header: 'STT',
      width: '60px',
      render: (_value: any, _row: VehicleUI, index?: number) => (
        <div className="text-center font-medium text-gray-700 dark:text-gray-300">
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
                <FaMotorcycle className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </div>
          {/* Vehicle Info */}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.licensePlate}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.brand} {row.model} ({row.year})</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {row.name} • {row.type === 'scooter' ? 'Xe máy điện' : 'Mô tô điện'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'color',
      header: 'Màu sắc',
      sortable: true,
      filterable: true,
      render: (value: string) => {
        // Map color values to display properties
        const getColorConfig = (color: string) => {
          const colorLower = color.toLowerCase();
          if (colorLower.includes('red') || colorLower.includes('đỏ')) {
            return { bgClass: 'bg-red-500', label: 'Đỏ' };
          } else if (colorLower.includes('blue') || colorLower.includes('xanh dương') || colorLower.includes('xanh d')) {
            return { bgClass: 'bg-blue-500', label: 'Xanh dương' };
          } else if (colorLower.includes('green') || colorLower.includes('xanh lá') || colorLower.includes('xanh l')) {
            return { bgClass: 'bg-green-500', label: 'Xanh lá' };
          } else if (colorLower.includes('yellow') || colorLower.includes('vàng')) {
            return { bgClass: 'bg-yellow-500', label: 'Vàng' };
          } else if (colorLower.includes('black') || colorLower.includes('đen')) {
            return { bgClass: 'bg-gray-900', label: 'Đen' };
          } else if (colorLower.includes('white') || colorLower.includes('trắng')) {
            return { bgClass: 'bg-white border border-gray-300', label: 'Trắng' };
          } else if (colorLower.includes('orange') || colorLower.includes('cam')) {
            return { bgClass: 'bg-orange-500', label: 'Cam' };
          } else if (colorLower.includes('purple') || colorLower.includes('tím')) {
            return { bgClass: 'bg-purple-500', label: 'Tím' };
          } else if (colorLower.includes('pink') || colorLower.includes('hồng')) {
            return { bgClass: 'bg-pink-500', label: 'Hồng' };
          } else if (colorLower.includes('gray') || colorLower.includes('grey') || colorLower.includes('xám')) {
            return { bgClass: 'bg-gray-500', label: 'Xám' };
          } else {
            return { bgClass: 'bg-gray-400', label: value };
          }
        };

        const colorConfig = getColorConfig(value);
        
        return (
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full border border-gray-300 ${colorConfig.bgClass}`}
              title={value}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {colorConfig.label}
            </span>
          </div>
        );
      }
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
      key: 'actions',
      header: 'Hành động',
      render: (_value: any, row: VehicleUI) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewVehicle(row);
            }}
            className="group h-9 w-9 p-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            title="Xem chi tiết xe"
            aria-label="Xem chi tiết xe"
          >
            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditVehicle(row);
            }}
            className="group h-9 w-9 p-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-600 hover:text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 border-2 border-green-300 hover:border-green-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            title="Chỉnh sửa xe"
            aria-label="Chỉnh sửa xe"
          >
            <Edit className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteVehicle(row);
            }}
            disabled={row.status !== 'draft'}
            className={`group h-9 w-9 p-0 border-2 shadow-sm transition-all duration-200 ${
              row.status === 'draft'
                ? 'bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-600 hover:text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 border-red-300 hover:border-red-500 hover:shadow-md hover:scale-110 cursor-pointer'
                : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700 opacity-50 cursor-not-allowed'
            }`}
            title={row.status === 'draft' ? 'Xóa xe' : 'Chỉ có thể xóa xe chưa gán biển'}
            aria-label="Xóa xe"
          >
            <Trash2 className={`h-4 w-4 transition-transform duration-200 ${row.status === 'draft' ? 'group-hover:scale-110' : ''}`} />
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
        className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 rounded-2xl py-5 px-8 shadow-xl border-0 overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg">
                Quản lý đội xe
              </h1>
              <p className="text-green-50 dark:text-green-100 flex items-center space-x-2">
                <span>Theo dõi và quản lý toàn bộ đội xe điện của bạn</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              loadVehicles();
              loadStatistics();
            }}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
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
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tổng số xe
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <FaMotorcycle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {statistics?.totalVehicles || 0}
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse shadow-sm" />
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
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Xe sẵn sàng
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {statistics?.availableVehicles || 0}
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
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
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Xe đang thuê
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                {statistics?.rentedVehicles || 0}
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
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
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Cần bảo trì
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
                {statistics?.maintenanceVehicles || 0}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
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
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-md">
          <CardContent className="p-6">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search với Clear Button & Debounce Loading */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Tìm kiếm xe theo model, biển số, thương hiệu..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 h-12 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 text-base"
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Xóa tìm kiếm"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                {loading && debouncedSearchTerm !== searchTerm && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                )}
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
                className={`flex items-center space-x-2 h-12 px-6 border-2 font-semibold transition-all ${
                  showFilterPanel 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400 shadow-md' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <Filter className="h-5 w-5" />
                <span>Bộ lọc</span>
                {showFilterPanel && <X className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                      <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Bộ lọc nâng cao
                  </h3>
                  <div className="flex items-center space-x-2">
                    {(statusFilter || typeFilter || colorFilter || debouncedSearchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter(null);
                          setTypeFilter(null);
                          setColorFilter(null);
                          setSearchTerm('');
                        }}
                        className="h-9 px-4 text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Xóa bộ lọc
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilterPanel(false)}
                      className="h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* 4 cột trên 1 hàng - Trạng thái, Loại xe, Màu sắc, Sắp xếp */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    <div className="w-1 h-4 bg-blue-600 rounded-full mr-2"></div>
                    Trạng thái
                  </label>
                  <div className="space-y-2.5">
                    <label className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="status"
                        checked={statusFilter === null}
                        onChange={() => setStatusFilter(null)}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        Tất cả trạng thái 
                        <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">({vehicles.length})</span>
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
                  <label className="flex items-center text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    <div className="w-1 h-4 bg-green-600 rounded-full mr-2"></div>
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

                {/* Color Filter với scroll riêng */}
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    <div className="w-1 h-4 bg-purple-600 rounded-full mr-2"></div>
                    Màu sắc
                  </label>
                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                    <div className="space-y-2.5">
                      <label className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <input
                          type="radio"
                          name="color"
                          checked={colorFilter === null}
                          onChange={() => setColorFilter(null)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          Tất cả
                        </span>
                      </label>
                      {[
                        { key: 'red', label: 'Đỏ', bgClass: 'bg-red-500' },
                        { key: 'blue', label: 'Xanh dương', bgClass: 'bg-blue-500' },
                        { key: 'green', label: 'Xanh lá', bgClass: 'bg-green-500' },
                        { key: 'yellow', label: 'Vàng', bgClass: 'bg-yellow-500' },
                        { key: 'black', label: 'Đen', bgClass: 'bg-gray-900' },
                        { key: 'white', label: 'Trắng', bgClass: 'bg-white border border-gray-400' },
                        { key: 'orange', label: 'Cam', bgClass: 'bg-orange-500' },
                        { key: 'purple', label: 'Tím', bgClass: 'bg-purple-500' },
                        { key: 'pink', label: 'Hồng', bgClass: 'bg-pink-500' },
                        { key: 'gray', label: 'Xám', bgClass: 'bg-gray-500' }
                      ].map((color) => (
                        <label key={color.key} className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <input
                            type="radio"
                            name="color"
                            checked={colorFilter === color.key}
                            onChange={() => setColorFilter(color.key)}
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2 flex-1">
                            <div 
                              className={`w-4 h-4 rounded-full flex-shrink-0 ${color.bgClass}`}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate">
                              {color.label}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    <div className="w-1 h-4 bg-orange-600 rounded-full mr-2"></div>
                    Sắp xếp
                  </label>
                  <div className="space-y-2.5">
                    <label className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'name'}
                        onChange={() => setSortBy('name')}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        Tên xe
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'battery'}
                        onChange={() => setSortBy('battery')}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        Mức pin
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'price'}
                        onChange={() => setSortBy('price')}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        Giá thuê
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === 'year'}
                        onChange={() => setSortBy('year')}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        Năm sản xuất
                      </span>
                    </label>
                  </div>
                </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t-2 border-blue-200 dark:border-blue-800">
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-2 border-blue-300 font-semibold px-3 py-1">
                    {filteredVehicles.length} xe tìm thấy
                  </Badge>
                  {filteredVehicles.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const element = document.getElementById('vehicle-list-section');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="h-9 px-5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md"
                    >
                      Xem kết quả
                    </Button>
                  )}
                </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
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
          <div>
            {/* Card View Header */}
            <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-md px-6 py-5 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Danh sách xe <span className="text-blue-600 dark:text-blue-400">({filteredVehicles.length})</span>
                </h3>
                {isUsingMockData && (
                  <Badge className="text-xs bg-amber-100 text-amber-700 border-2 border-amber-300 font-semibold px-3 py-1">
                    📊 Dữ liệu demo
                  </Badge>
                )}
                {(statusFilter || typeFilter || colorFilter || debouncedSearchTerm) && (
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-2 border-blue-300 font-semibold px-3 py-1">
                    🔍 Đang lọc
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Mode Buttons */}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 font-medium"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4 mr-1.5" />
                  Table
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4 mr-1.5" />
                  Card
                </Button>

                {/* Action Buttons - Professional Design */}
                <div className="h-7 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 hover:border-blue-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-blue-700 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-400"
                  onClick={() => setLicensePlateModalOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                  Biển số
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-700 hover:border-amber-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-amber-700 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-400"
                  onClick={() => setBulkPricingModalOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Giá
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:border-purple-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-purple-700 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400"
                  onClick={() => setAssignmentModalOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Phân bổ
                </Button>
                <Button 
                  size="sm"
                  className="group h-9 px-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0"
                  onClick={() => setBulkModalOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Tạo xe
                </Button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800">
              <VehicleCardGrid
                vehicles={filteredVehicles}
                loading={loading}
                onEdit={handleEditVehicle}
                onAssign={handleAssignVehicle}
                onView={handleViewVehicle}
                onBulkAction={handleBulkAction}
              />
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Table Header with Actions */}
            <div className="px-6 py-5 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Danh sách xe <span className="text-blue-600 dark:text-blue-400">({filteredVehicles.length})</span>
                </h3>
                {isUsingMockData && (
                  <Badge className="text-xs bg-amber-100 text-amber-700 border-2 border-amber-300 font-semibold px-3 py-1">
                    📊 Dữ liệu demo
                  </Badge>
                )}
                {(statusFilter || typeFilter || colorFilter || debouncedSearchTerm) && (
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-2 border-blue-300 font-semibold px-3 py-1">
                    🔍 Đang lọc
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Mode Buttons */}
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4 mr-1.5" />
                  Table
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 font-medium"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4 mr-1.5" />
                  Card
                </Button>

                {/* Action Buttons - Professional Design */}
                <div className="h-7 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 hover:border-blue-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-blue-700 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-400"
                  onClick={() => setLicensePlateModalOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                  Biển số
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-700 hover:border-amber-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-amber-700 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-400"
                  onClick={() => setBulkPricingModalOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Giá
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:border-purple-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-purple-700 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400"
                  onClick={() => setAssignmentModalOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Phân bổ
                </Button>
                <Button 
                  size="sm"
                  className="group h-9 px-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0"
                  onClick={() => setBulkModalOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Tạo xe
                </Button>
              </div>
            </div>

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
            />
          </div>
        ) : (
          <div>
            {/* Map View Header */}
            <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-md px-6 py-5 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Danh sách xe <span className="text-blue-600 dark:text-blue-400">({filteredVehicles.length})</span>
                </h3>
                {isUsingMockData && (
                  <Badge className="text-xs bg-amber-100 text-amber-700 border-2 border-amber-300 font-semibold px-3 py-1">
                    📊 Dữ liệu demo
                  </Badge>
                )}
                {(statusFilter || typeFilter || colorFilter || debouncedSearchTerm) && (
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-2 border-blue-300 font-semibold px-3 py-1">
                    🔍 Đang lọc
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Mode Buttons */}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 font-medium"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4 mr-1.5" />
                  Table
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 font-medium"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4 mr-1.5" />
                  Card
                </Button>

                {/* Action Buttons - Professional Design */}
                <div className="h-7 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 hover:border-blue-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-blue-700 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-400"
                  onClick={() => setLicensePlateModalOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                  Biển số
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-700 hover:border-amber-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-amber-700 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-400"
                  onClick={() => setBulkPricingModalOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Giá
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group h-9 px-4 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:border-purple-500 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 dark:border-purple-700 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400"
                  onClick={() => setAssignmentModalOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Phân bổ
                </Button>
                <Button 
                  size="sm"
                  className="group h-9 px-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0"
                  onClick={() => setBulkModalOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Tạo xe
                </Button>
              </div>
            </div>

            {/* Table View */}
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
            />
          </div>
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

      <VehicleDetailModal
        isOpen={viewDetailModalOpen}
        onClose={() => {
          setViewDetailModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onEdit={(vehicle) => {
          setSelectedVehicle(vehicle);
          setEditModalOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setVehicleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa xe"
        message={`Bạn có chắc chắn muốn xóa xe "${vehicleToDelete?.licensePlate}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa xe"
        cancelText="Hủy"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Search, 
  RefreshCw, 
  BarChart3,
  Building2,
  Globe,
  Car,
  X
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CreateStationModal } from '../components/CreateStationModal';
import { EditStationModal } from '../components/EditStationModal';
import { StationDetailModal } from '../components/StationDetailModal';
import { stationService } from '../components/service/stationService';
import type { Station, StationStatistics } from '../components/service/type/stationTypes';

export function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [statistics, setStatistics] = useState<StationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [syncingStations, setSyncingStations] = useState<Set<string>>(new Set());
  const [stationsWithErrors, setStationsWithErrors] = useState<Set<string>>(new Set());

  // Calculate statistics from stations data
  const calculateStationStatistics = (stationsData: Station[]): StationStatistics => {
    const totalStations = stationsData.length;
    const activeStations = stationsData.filter(s => s.status === 'active').length;
    const inactiveStations = stationsData.filter(s => s.status === 'inactive').length;
    const stationsWithVehicles = stationsData.filter(s => s.current_vehicles > 0).length;
    const averageVehiclesPerStation = totalStations > 0 
      ? Math.round(stationsData.reduce((sum, s) => sum + s.current_vehicles, 0) / totalStations)
      : 0;
    
    return {
      totalStations,
      activeStations,
      inactiveStations,
      stationsWithVehicles,
      averageVehiclesPerStation
    };
  };

  // Load data
  useEffect(() => {
    loadStations();
    // Statistics will be calculated automatically when stations data changes
  }, []);

  // Update statistics when stations data changes
  useEffect(() => {
    if (stations && stations.length > 0) {
      // Recalculate statistics from stations data
      const mockStats = calculateStationStatistics(stations);
      setStatistics(mockStats);
      
      console.log('📊 Phân tích trạm:');
      
      const fullCapacityStations = stations.filter(station => 
        station.current_vehicles >= station.max_capacity
      );
      
      const stationsWithIssues = stations.filter(station => {
        const issues = checkStationSyncIssues(station);
        return issues.length > 0;
      });
      
      if (fullCapacityStations.length > 0) {
        console.log(`⚠️ ${fullCapacityStations.length} trạm đã đạt sức chứa tối đa (sync bị tắt):`);
        fullCapacityStations.forEach(station => {
          console.log(`   🏢 ${station.name}: ${station.current_vehicles}/${station.max_capacity}`);
        });
        console.log(`💡 Khuyến nghị: Di chuyển xe ra khỏi các trạm này hoặc tăng sức chứa tối đa để có thể đồng bộ.`);
      }
      
      if (stationsWithIssues.length > 0) {
        console.log(`⚠️ Tìm thấy ${stationsWithIssues.length} trạm có vấn đề tiềm ẩn:`);
        stationsWithIssues.forEach(station => {
          const issues = checkStationSyncIssues(station);
          console.log(`   🏢 ${station.name}:`);
          issues.forEach(issue => console.log(`      - ${issue}`));
        });
      } else if (fullCapacityStations.length === 0) {
        console.log('✅ Tất cả trạm đều ổn định và có thể sync');
      }
    }
  }, [stations]);

  const loadStations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await stationService.getStations({
        page: 1,
        limit: 100,
        search: searchTerm,
        status: filterActive ? 'active' : filterActive === false ? 'inactive' : undefined
      });
      setStations(response.stations);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadStations(); // Reload stations list - statistics will auto-update
  };

  const handleEditSuccess = () => {
    loadStations(); // Reload stations list - statistics will auto-update
  };


  const handleViewStation = (station: Station) => {
    setSelectedStationId(station._id);
    setShowDetailModal(true);
  };


  const handleSyncStation = async (station: Station) => {
    try {
      // Early return if station is at full capacity (should not happen due to disabled button)
      if (station.current_vehicles >= station.max_capacity) {
        console.log(`⚠️ Không thể sync: Trạm ${station.name} đã đạt sức chứa tối đa (${station.current_vehicles}/${station.max_capacity})`);
        return;
      }

      // Check for other potential issues before syncing
      const issues = checkStationSyncIssues(station);
      if (issues.length > 0) {
        console.log(`⚠️ Phát hiện vấn đề tiềm ẩn với trạm ${station.name}:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
        
        // Ask user if they want to proceed despite issues
        const proceed = window.confirm(
          `Trạm ${station.name} có vấn đề tiềm ẩn:\n${issues.join('\n')}\n\nBạn có muốn tiếp tục đồng bộ không?`
        );
        
        if (!proceed) {
          console.log(`❌ Người dùng hủy đồng bộ trạm ${station.name} do phát hiện vấn đề.`);
          return;
        }
      }
      
      // Add station to syncing set
      setSyncingStations(prev => new Set(prev).add(station._id));
      
      const response = await stationService.syncStation(station._id);
      
      // Show success message based on actual API response
      if (response.data && response.data.station) {
        const updatedStation = response.data.station;
        console.log(`✅ ${response.data.message} - Trạm ${updatedStation.name}: ${updatedStation.current_vehicles} xe`);
        
        // Update only this station in the list instead of reloading all
        setStations(prevStations => 
          prevStations.map(s => 
            s._id === station._id 
              ? { ...s, ...updatedStation } as Station
              : s
          )
        );
        
        // Update statistics from current stations data (no API call needed)
        setTimeout(() => {
          updateStatisticsFromStations();
        }, 100); // Small delay to ensure state is updated
        
        // Remove from error list if sync was successful
        setStationsWithErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(station._id);
          return newSet;
        });
      } else {
        console.log(`✅ Đồng bộ trạm ${station.name} thành công`);
        
        // Remove from error list if sync was successful
        setStationsWithErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(station._id);
          return newSet;
        });
      }
      
    } catch (error: any) {
      console.error('Error syncing station:', error);
      
      // Extract detailed error information
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const errorDetails = error.response?.data?.details || '';
      const statusCode = error.response?.status;
      
      // Handle different error types with detailed messages
      if (statusCode === 500) {
        console.log(`⚠️ Lỗi server khi đồng bộ trạm ${station.name}`);
        console.log(`📋 Chi tiết: ${errorMessage}`);
        if (errorDetails) {
          console.log(`🔍 Thông tin thêm: ${errorDetails}`);
        }
        
        // Special handling for full capacity causing 500 error
        if (station.current_vehicles >= station.max_capacity) {
          console.log(`⚠️ Nguyên nhân có thể: Trạm đã đạt sức chứa tối đa (${station.current_vehicles}/${station.max_capacity})`);
          console.log(`💡 Giải pháp: Backend cần xử lý trường hợp trạm full capacity gracefully`);
        } else if (errorMessage.includes('capacity') || errorMessage.includes('full') || errorMessage.includes('maximum')) {
          console.log(`⚠️ Nguyên nhân có thể: Vấn đề về sức chứa trạm`);
          console.log(`💡 Giải pháp: Kiểm tra và điều chỉnh sức chứa trạm`);
        } else {
          console.log(`💡 Nguyên nhân có thể: API backend chưa được implement đầy đủ hoặc có lỗi xử lý`);
        }
      } else if (statusCode === 400) {
        console.log(`❌ Dữ liệu không hợp lệ cho trạm ${station.name}`);
        console.log(`📋 Chi tiết: ${errorMessage}`);
        // Có thể là trạm đã full capacity hoặc có vấn đề với dữ liệu
        if (errorMessage.includes('capacity') || errorMessage.includes('full') || station.current_vehicles >= station.max_capacity) {
          console.log(`⚠️ Lý do: Trạm ${station.name} đã đạt sức chứa tối đa (${station.current_vehicles}/${station.max_capacity})`);
          console.log(`💡 Giải pháp: Cần di chuyển xe ra khỏi trạm hoặc tăng sức chứa tối đa`);
        }
      } else if (statusCode === 403) {
        console.log(`❌ Không có quyền đồng bộ trạm ${station.name}.`);
      } else if (statusCode === 404) {
        console.log(`❌ Không tìm thấy trạm ${station.name}.`);
      } else if (statusCode === 409) {
        console.log(`⚠️ Xung đột dữ liệu khi đồng bộ trạm ${station.name}`);
        console.log(`📋 Chi tiết: ${errorMessage}`);
        // Có thể là xe đang được sử dụng hoặc đã được assign
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        console.log(`❌ Lỗi kết nối mạng khi đồng bộ trạm ${station.name}.`);
        console.log(`💡 Giải pháp: Kiểm tra kết nối internet và thử lại.`);
      } else {
        console.log(`❌ Lỗi không xác định khi đồng bộ trạm ${station.name}`);
        console.log(`📋 Status: ${statusCode}, Message: ${errorMessage}`);
      }
      
      // Log current station capacity for debugging
      console.log(`📊 Thông tin trạm ${station.name}:`);
      console.log(`   - Sức chứa tối đa: ${station.max_capacity}`);
      console.log(`   - Xe hiện tại: ${station.current_vehicles}`);
      console.log(`   - Xe khả dụng: ${station.available_vehicles}`);
      console.log(`   - Xe đang thuê: ${station.rented_vehicles}`);
      console.log(`   - Xe bảo trì: ${station.maintenance_vehicles}`);
      
      // Show suggested solutions
      const solutions = suggestSolutions(station);
      if (solutions.length > 0) {
        solutions.forEach(solution => console.log(solution));
      }
      
      // Mark station as having error for UI indication
      setStationsWithErrors(prev => new Set(prev).add(station._id));
    } finally {
      // Remove station from syncing set
      setSyncingStations(prev => {
        const newSet = new Set(prev);
        newSet.delete(station._id);
        return newSet;
      });
    }
  };

  const handleDeleteStation = async (station: Station) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa trạm "${station.name}"?`)) {
      try {
        await stationService.deleteStation(station._id);
        console.log('Station deleted successfully');
        loadStations(); // Reload stations list - statistics will auto-update
      } catch (error) {
        console.error('Error deleting station:', error);
        // You can add toast notification here
      }
    }
  };

  // Calculate statistics from current stations data (without API call)
  const updateStatisticsFromStations = () => {
    if (stations && stations.length > 0) {
      const totalStations = stations.length;
      const activeStations = stations.filter(s => s.status === 'active').length;
      const inactiveStations = stations.filter(s => s.status === 'inactive').length;
      const stationsWithVehicles = stations.filter(s => s.current_vehicles > 0).length;
      const totalVehicles = stations.reduce((sum, s) => sum + s.current_vehicles, 0);
      const averageVehiclesPerStation = totalStations > 0 ? Math.round(totalVehicles / totalStations) : 0;

      setStatistics({
        totalStations,
        activeStations,
        inactiveStations,
        stationsWithVehicles,
        averageVehiclesPerStation
      });
    }
  };

  // Check for potential sync issues
  const checkStationSyncIssues = (station: Station) => {
    const issues = [];
    
    // Check if station is at full capacity
    if (station.current_vehicles >= station.max_capacity) {
      issues.push(`Trạm đã đạt sức chứa tối đa (${station.current_vehicles}/${station.max_capacity})`);
    }
    
    // Check if there's a mismatch in vehicle counts
    const totalCounted = station.available_vehicles + station.rented_vehicles + station.maintenance_vehicles;
    if (totalCounted !== station.current_vehicles) {
      issues.push(`Không khớp số lượng xe: ${totalCounted} (đếm) vs ${station.current_vehicles} (tổng)`);
    }
    
    // Check if station is inactive but has vehicles
    if (station.status !== 'active' && station.current_vehicles > 0) {
      issues.push(`Trạm không hoạt động nhưng vẫn có ${station.current_vehicles} xe`);
    }
    
    return issues;
  };

  // Suggest solutions for station issues
  const suggestSolutions = (station: Station) => {
    const solutions = [];
    
    if (station.current_vehicles >= station.max_capacity) {
      solutions.push('💡 Giải pháp cho trạm full:');
      solutions.push('   1. Di chuyển một số xe sang trạm khác có chỗ trống');
      solutions.push('   2. Tăng sức chứa tối đa của trạm trong cài đặt');
      solutions.push('   3. Kiểm tra xe nào đang bảo trì có thể di chuyển');
    }
    
    const totalCounted = station.available_vehicles + station.rented_vehicles + station.maintenance_vehicles;
    if (totalCounted !== station.current_vehicles) {
      solutions.push('💡 Giải pháp cho dữ liệu không nhất quán:');
      solutions.push('   1. Chạy script kiểm tra và sửa dữ liệu database');
      solutions.push('   2. Sync lại từ hệ thống quản lý xe');
      solutions.push('   3. Liên hệ IT để kiểm tra tính toàn vẹn dữ liệu');
    }
    
    return solutions;
  };


  // Filter stations based on search and active status
  const filteredStations = (stations || []).filter(station => {
    const matchesSearch = !searchTerm || 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === null || 
      (filterActive === true && station.status === 'active') ||
      (filterActive === false && station.status === 'inactive');
    
    return matchesSearch && matchesFilter;
  });

  const stationColumns = [
    {
      key: 'name',
      header: 'TÊN TRẠM',
      render: (_value: string, row: Station) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">Code: {row.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'VỊ TRÍ',
      render: (_value: string, row: Station) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-900">{row.district}, {row.city}</div>
            <div className="text-xs text-gray-500 truncate max-w-32">{row.address}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (value: string) => (
        <Badge variant={
          value === 'active' ? 'success' : 
          value === 'maintenance' ? 'warning' : 'secondary'
        } className={
          value === 'inactive' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''
        }>
          {value === 'active' ? 'Hoạt động' : 
           value === 'maintenance' ? 'Bảo trì' : 'Tạm dừng'}
        </Badge>
      )
    },
    {
      key: 'vehicles',
      header: 'XE TẠI TRẠM',
      render: (_value: any, row: Station) => {
        const isAtCapacity = row.current_vehicles >= row.max_capacity;
        const isNearCapacity = row.current_vehicles >= row.max_capacity * 0.9;
        
        return (
          <div className="flex items-center space-x-2">
            <Car className={`h-4 w-4 ${
              isAtCapacity ? 'text-red-600' : 
              isNearCapacity ? 'text-yellow-600' : 
              'text-green-600'
            }`} />
            <span className={`font-medium ${
              isAtCapacity ? 'text-red-600' : 
              isNearCapacity ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {row.current_vehicles}/{row.max_capacity}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      render: (_value: any, row: Station) => (
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleViewStation(row)}
            title="Xem chi tiết"
          >
            <Building2 className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleSyncStation(row)}
            disabled={
              syncingStations.has(row._id) || 
              row.current_vehicles >= row.max_capacity
            }
            className={`${
              stationsWithErrors.has(row._id) 
                ? 'border-red-300 text-red-600 hover:bg-red-50' 
                : row.current_vehicles >= row.max_capacity
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : ''
            }`}
            title={
              row.current_vehicles >= row.max_capacity
                ? `Không thể sync: Trạm đã đạt sức chứa tối đa (${row.current_vehicles}/${row.max_capacity}). Cần di chuyển xe hoặc tăng capacity.`
                : stationsWithErrors.has(row._id) 
                ? 'Trạm này gặp lỗi khi sync lần trước. Click để thử lại.' 
                : `Đồng bộ xe (${row.current_vehicles}/${row.max_capacity})`
            }
          >
            <RefreshCw className={`h-3 w-3 ${
              syncingStations.has(row._id) ? 'animate-spin' : 
              row.current_vehicles >= row.max_capacity ? 'text-gray-400' : ''
            }`} />
            {stationsWithErrors.has(row._id) && !(row.current_vehicles >= row.max_capacity) && (
              <span className="ml-1 text-red-500 text-xs">⚠️</span>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteStation(row)}
            title="Xóa"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quản lý trạm thuê
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Quản lý và theo dõi các trạm thuê xe điện trong hệ thống
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => loadStations()}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2 border-gray-300 hover:border-gray-400"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </Button>
            <Button 
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Thêm trạm</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng số trạm
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics?.totalStations || 0}
              </div>
              <p className="text-xs text-gray-500">
                {statistics?.activeStations || 0} đang hoạt động
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
                Trạm có xe
              </CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics?.stationsWithVehicles || 0}
              </div>
              <p className="text-xs text-gray-500">
                Trung bình {statistics?.averageVehiclesPerStation || 0} xe/trạm
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
                Trạm hoạt động
              </CardTitle>
              <Globe className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics?.activeStations || 0}
              </div>
              <p className="text-xs text-gray-500">
                {statistics?.inactiveStations || 0} tạm dừng
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
                Tỷ lệ hoạt động
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statistics ? 
                  Math.round((statistics.activeStations / statistics.totalStations) * 100) : 0
                }%
              </div>
              <p className="text-xs text-gray-500">
                Trạm đang hoạt động
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterActive === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(null)}
                  className={filterActive === null ? "bg-gray-800 text-white hover:bg-gray-900" : "border-gray-300 hover:border-gray-400"}
                >
                  Tất cả
                </Button>
                <Button
                  variant={filterActive === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(true)}
                  className={filterActive === true ? "bg-green-600 text-white hover:bg-green-700" : "border-gray-300 hover:border-gray-400"}
                >
                  Hoạt động
                </Button>
                <Button
                  variant={filterActive === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(false)}
                  className={filterActive === false ? "bg-amber-500 text-white hover:bg-amber-600" : "border-gray-300 hover:border-gray-400"}
                >
                  Tạm dừng
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <DataTable
          title={`Danh sách trạm (${filteredStations.length})`}
          columns={stationColumns}
          data={filteredStations}
          loading={loading}
        />
      </motion.div>

      {/* Create Station Modal */}
      <CreateStationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Station Modal */}
      <EditStationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStation(null);
        }}
        onSuccess={handleEditSuccess}
        station={selectedStation}
      />

      {/* Station Detail Modal */}
      <StationDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedStationId(null);
        }}
        stationId={selectedStationId}
        onEdit={(station) => {
          setSelectedStation(station);
          setShowEditModal(true);
          setShowDetailModal(false);
        }}
      />

    </div>
  );
}

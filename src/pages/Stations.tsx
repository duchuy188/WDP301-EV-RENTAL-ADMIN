import { useState, useEffect, useCallback } from 'react';
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
  X,
  Trash2,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProfessionalPagination } from '../components/ui/professional-pagination';
import { CreateStationModal } from '../components/CreateStationModal';
import { EditStationModal } from '../components/EditStationModal';
import { StationDetailModal } from '../components/StationDetailModal';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { stationService } from '../components/service/stationService';
import { showToast } from '../lib/toast';
import type { Station, StationStatistics } from '../components/service/type/stationTypes';

export function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [statistics, setStatistics] = useState<StationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1500); // Debounce search với 1500ms
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [syncingStations, setSyncingStations] = useState<Set<string>>(new Set());
  const [stationsWithErrors, setStationsWithErrors] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Fetch global statistics một lần khi mount
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await stationService.getStations({
          page: 1,
          limit: 999, // Get all stations
        });
        
        // Calculate global statistics
        const globalStats = calculateStationStatistics(response.stations);
        setStatistics(globalStats);
      
        console.log('📊 Global Station Statistics:', globalStats);
      } catch (error) {
        console.error('❌ Error fetching global station stats:', error);
      }
    };
    
    fetchGlobalStats();
  }, []);

  // Load data when debounced search or filter changes
  useEffect(() => {
    loadStations();
  }, [debouncedSearchTerm, filterActive]);

  const loadStations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await stationService.getStations({
        page: 1,
        limit: 999,
        search: debouncedSearchTerm,
        status: filterActive ? 'active' : filterActive === false ? 'inactive' : undefined
      });
      setStations(response.stations);
      
      // Nếu không có filter, cập nhật global statistics
      if (!debouncedSearchTerm && filterActive === null) {
        const globalStats = calculateStationStatistics(response.stations);
        setStatistics(globalStats);
      }
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Memoized handlers
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterActive(null);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    // Reset filters để load lại toàn bộ
    setSearchTerm('');
    setFilterActive(null);
    loadStations(); // Reload stations list - statistics will auto-update
  }, []);

  const handleEditSuccess = useCallback(() => {
    loadStations(); // Reload stations list - statistics will auto-update
  }, []);

  const handleViewStation = useCallback((station: Station) => {
    setSelectedStationId(station._id);
    setShowDetailModal(true);
  }, []);


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

  const handleDeleteStation = useCallback((station: Station) => {
    setStationToDelete(station);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!stationToDelete) return;
    
    try {
      setDeleting(true);
      await stationService.deleteStation(stationToDelete._id);
      
      // 1. Close confirmation dialog
      setShowDeleteConfirm(false);
      
      // 2. Show success toast với tên trạm
      showToast.success(`Xóa trạm "${stationToDelete.name}" thành công`);
      
      // 3. Reload stations list - statistics will auto-update
      loadStations();
      
      // 4. Reset state
      setStationToDelete(null);
      
    } catch (error: any) {
        console.error('Error deleting station:', error);
      showToast.error(error.response?.data?.message || 'Không thể xóa trạm');
      // Modal KHÔNG đóng khi lỗi
    } finally {
      setDeleting(false);
      }
  }, [stationToDelete, loadStations]);

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
    
    // NOTE: Không check mismatch nữa vì:
    // - Backend chỉ trả về: available_vehicles, rented_vehicles, maintenance_vehicles
    // - Nhưng thực tế có 5 trạng thái: draft, available, reserved, rented, maintenance
    // - Sự chênh lệch là bình thường (draft + reserved vehicles)
    // const totalCounted = station.available_vehicles + station.rented_vehicles + station.maintenance_vehicles;
    // if (totalCounted !== station.current_vehicles) {
    //   const difference = station.current_vehicles - totalCounted;
    //   console.log(`ℹ️ Trạm ${station.name}: ${difference} xe có thể đang ở trạng thái draft hoặc reserved`);
    // }
    
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
    
    return solutions;
  };


  // Use stations from API (already filtered)
  const filteredStations = stations || [];

  // Pagination calculation
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStations = filteredStations.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterActive]);

  const stationColumns = [
    {
      key: 'stt',
      header: 'STT',
      render: (_value: any, _row: any, index?: number) => {
        const stt = (index ?? 0) + 1;
        return (
          <span className="font-medium text-sm text-gray-600 dark:text-gray-400">{stt}</span>
        );
      }
    },
    {
      key: 'name',
      header: 'TÊN TRẠM',
      render: (_value: string, row: Station) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
            {row.images && row.images.length > 0 ? (
              <img
                src={row.images[0]}
                alt={row.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${row.images && row.images.length > 0 ? 'hidden' : ''}`}>
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Code: {row.code}</div>
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
      header: 'Hành động',
      render: (_value: any, row: Station) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewStation(row);
            }}
            className="group h-9 w-9 p-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            title="Xem chi tiết trạm"
            aria-label="Xem chi tiết trạm"
          >
            <Building2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSyncStation(row);
            }}
            disabled={
              syncingStations.has(row._id) || 
              row.current_vehicles >= row.max_capacity
            }
            className={`group h-9 w-9 p-0 border-2 shadow-sm transition-all duration-200 ${
              stationsWithErrors.has(row._id) 
                ? 'bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-600 hover:text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 border-red-300 hover:border-red-500 hover:shadow-md hover:scale-110' 
                : row.current_vehicles >= row.max_capacity
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-600 hover:text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 border-purple-300 hover:border-purple-500 hover:shadow-md hover:scale-110'
            }`}
            title={
              row.current_vehicles >= row.max_capacity
                ? `Không thể sync: Trạm đã đạt sức chứa tối đa (${row.current_vehicles}/${row.max_capacity})`
                : stationsWithErrors.has(row._id) 
                ? 'Trạm này gặp lỗi khi sync lần trước. Click để thử lại.' 
                : `Đồng bộ xe (${row.current_vehicles}/${row.max_capacity})`
            }
            aria-label="Đồng bộ xe"
          >
            <RefreshCw className={`h-4 w-4 ${syncingStations.has(row._id) ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-200'}`} />
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteStation(row);
            }}
            className="group h-9 w-9 p-0 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-600 hover:text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 border-2 border-red-300 hover:border-red-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            title="Xóa trạm"
            aria-label="Xóa trạm"
          >
            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
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
        className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 rounded-2xl py-5 px-8 shadow-xl border-0 overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg">
              Quản lý trạm thuê
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Quản lý và theo dõi các trạm thuê xe điện trong hệ thống
            </p>
          </div>
          <Button
            onClick={() => loadStations()}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2 bg-white/90 hover:bg-white border-white/50 hover:border-white text-green-700 hover:text-green-800 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
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
                Tổng số trạm
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {statistics?.totalStations || 0}
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse shadow-sm" />
                  <span>{statistics?.activeStations || 0} đang hoạt động</span>
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
                Trạm có xe
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <Car className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {statistics?.stationsWithVehicles || 0}
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>Trung bình {statistics?.averageVehiclesPerStation || 0} xe/trạm</span>
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Trạm hoạt động
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md">
                <Globe className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                {statistics?.activeStations || 0}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {statistics?.inactiveStations || 0} tạm dừng
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tỷ lệ hoạt động
              </CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                {statistics ? 
                  Math.round((statistics.activeStations / statistics.totalStations) * 100) : 0
                }%
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
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
            <div className="flex flex-col gap-4">
              {/* Search with Clear Button & Debounce Loading */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Xóa tìm kiếm"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {loading && debouncedSearchTerm !== searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
                  )}
              </div>
              </div>
              
              {/* Filter Status Buttons - Professional */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lọc trạng thái:
                </span>
                <div className="flex gap-2 flex-1">
                <Button
                  variant={filterActive === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(null)}
                    className={`h-9 px-4 transition-all ${
                      filterActive === null 
                        ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md hover:shadow-lg" 
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                >
                  Tất cả
                    {filterActive === null && statistics && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                        {statistics.totalStations}
                      </span>
                    )}
                </Button>
                <Button
                  variant={filterActive === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(true)}
                    className={`h-9 px-4 transition-all ${
                      filterActive === true 
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:shadow-lg" 
                        : "border-gray-300 hover:border-gray-400 hover:bg-green-50"
                    }`}
                >
                  Hoạt động
                    {filterActive === true && statistics && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                        {statistics.activeStations}
                      </span>
                    )}
                </Button>
                <Button
                  variant={filterActive === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(false)}
                    className={`h-9 px-4 transition-all ${
                      filterActive === false 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg" 
                        : "border-gray-300 hover:border-gray-400 hover:bg-amber-50"
                    }`}
                >
                  Tạm dừng
                    {filterActive === false && statistics && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                        {statistics.inactiveStations}
                      </span>
                    )}
                </Button>
                  
                  {/* Reset Filters - chỉ hiện khi có filter active */}
                  {(searchTerm || filterActive !== null) && (
                    <Button 
                      onClick={handleResetFilters} 
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 flex items-center space-x-2 ml-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Đặt lại</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stations View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Table Header with Actions */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Danh sách trạm ({filteredStations.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Thêm trạm</span>
              </Button>
            </div>
          </div>
            
            {/* DataTable without title */}
            <DataTable
              columns={stationColumns}
              data={paginatedStations}
              loading={loading}
            />

            {/* Professional Pagination */}
            {totalPages > 1 && (
              <div className="px-6 pb-4">
                <ProfessionalPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStations.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newSize) => {
                    setItemsPerPage(newSize);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                  loading={loading}
                  itemsLabel="trạm"
                />
              </div>
            )}
        </div>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setStationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa trạm"
        message={`Bạn có chắc chắn muốn xóa trạm "${stationToDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa trạm"
        cancelText="Hủy"
        variant="danger"
        loading={deleting}
      />

    </div>
  );
}

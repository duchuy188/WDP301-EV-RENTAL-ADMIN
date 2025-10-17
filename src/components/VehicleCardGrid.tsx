import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleCard } from './VehicleCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  Grid2X2,
  LayoutGrid,
  CheckSquare,
  Square,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import type { VehicleUI, VehicleStatus, VehicleType } from './service/type/vehicleTypes';

interface VehicleCardGridProps {
  vehicles: VehicleUI[];
  loading?: boolean;
  onEdit?: (vehicle: VehicleUI) => void;
  onDelete?: (vehicle: VehicleUI) => void;
  onAssign?: (vehicle: VehicleUI) => void;
  onView?: (vehicle: VehicleUI) => void;
  onBulkAction?: (action: string, vehicles: VehicleUI[]) => void;
  onAddNew?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  className?: string;
}

type SortField = 'name' | 'batteryLevel' | 'status' | 'pricePerDay' | 'year';
type SortDirection = 'asc' | 'desc';
type GridSize = 'small' | 'medium' | 'large';

export function VehicleCardGrid({
  vehicles,
  loading = false,
  onEdit,
  onDelete,
  onAssign,
  onView,
  onBulkAction,
  onAddNew,
  onImport,
  onExport,
  className = ''
}: VehicleCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [gridSize, setGridSize] = useState<GridSize>('medium');
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles.filter(vehicle => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate} ${vehicle.name}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && vehicle.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && vehicle.type !== typeFilter) return false;

      return true;
    });

    // Sort vehicles
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.brand} ${a.model}`.toLowerCase();
          bValue = `${b.brand} ${b.model}`.toLowerCase();
          break;
        case 'batteryLevel':
          aValue = a.batteryLevel;
          bValue = b.batteryLevel;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'pricePerDay':
          aValue = a.pricePerDay;
          bValue = b.pricePerDay;
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [vehicles, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectVehicle = (vehicle: VehicleUI, selected: boolean) => {
    const newSelected = new Set(selectedVehicles);
    if (selected) {
      newSelected.add(vehicle.id);
    } else {
      newSelected.delete(vehicle.id);
    }
    setSelectedVehicles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVehicles.size === filteredAndSortedVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredAndSortedVehicles.map(v => v.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    const selectedVehicleObjects = vehicles.filter(v => selectedVehicles.has(v.id));
    if (onBulkAction) {
      onBulkAction(action, selectedVehicleObjects);
    }
    setSelectedVehicles(new Set()); // Clear selection after action
  };

  const getGridClassName = () => {
    switch (gridSize) {
      case 'small':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
      case 'medium':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái', count: vehicles.length },
    { value: 'available', label: 'Sẵn sàng', count: vehicles.filter(v => v.status === 'available').length },
    { value: 'rented', label: 'Đang thuê', count: vehicles.filter(v => v.status === 'rented').length },
    { value: 'maintenance', label: 'Bảo trì', count: vehicles.filter(v => v.status === 'maintenance').length },
    { value: 'broken', label: 'Hỏng', count: vehicles.filter(v => v.status === 'broken').length },
  ];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Loading Grid */}
        <div className={`grid gap-6 ${getGridClassName()}`}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Danh sách xe ({filteredAndSortedVehicles.length})
          </h2>
          
          {selectedVehicles.size > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              Đã chọn {selectedVehicles.size} xe
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Grid Size Controls */}
          <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <Button
              size="sm"
              variant={gridSize === 'small' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              onClick={() => setGridSize('small')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={gridSize === 'medium' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              onClick={() => setGridSize('medium')}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={gridSize === 'large' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              onClick={() => setGridSize('large')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          {onAddNew && (
            <Button onClick={onAddNew} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Thêm xe</span>
            </Button>
          )}

          {onImport && (
            <Button variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}

          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm xe theo tên, biển số, thương hiệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Bộ lọc</span>
          </Button>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <div className="space-y-2">
                    {statusOptions.map(option => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={statusFilter === option.value}
                          onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label} ({option.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loại xe
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="type"
                        value="all"
                        checked={typeFilter === 'all'}
                        onChange={(e) => setTypeFilter('all')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Tất cả loại
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="type"
                        value="scooter"
                        checked={typeFilter === 'scooter'}
                        onChange={(e) => setTypeFilter('scooter')}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Xe máy điện
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="type"
                        value="motorcycle"
                        checked={typeFilter === 'motorcycle'}
                        onChange={(e) => setTypeFilter('motorcycle')}
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
                    {[
                      { field: 'name', label: 'Tên xe' },
                      { field: 'batteryLevel', label: 'Mức pin' },
                      { field: 'pricePerDay', label: 'Giá thuê' },
                      { field: 'year', label: 'Năm sản xuất' }
                    ].map(option => (
                      <Button
                        key={option.field}
                        variant={sortField === option.field ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort(option.field as SortField)}
                        className="w-full justify-between"
                      >
                        <span>{option.label}</span>
                        {sortField === option.field && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      {selectedVehicles.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center space-x-2"
              >
                {selectedVehicles.size === filteredAndSortedVehicles.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>
                  {selectedVehicles.size === filteredAndSortedVehicles.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </span>
              </Button>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Đã chọn {selectedVehicles.size} xe
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('assign')}
              >
                Phân bổ hàng loạt
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('maintenance')}
              >
                Chuyển bảo trì
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('export')}
              >
                Export đã chọn
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Vehicle Grid */}
      {filteredAndSortedVehicles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Grid3X3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Không tìm thấy xe nào
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className={`grid gap-6 ${getGridClassName()}`}
        >
          <AnimatePresence>
            {filteredAndSortedVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAssign={onAssign}
                onView={onView}
                isSelected={selectedVehicles.has(vehicle.id)}
                onSelect={handleSelectVehicle}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}






import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleCard } from './VehicleCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Grid3X3,
  CheckSquare,
  Square
} from 'lucide-react';
import type { VehicleUI } from './service/type/vehicleTypes';

interface VehicleCardGridProps {
  vehicles: VehicleUI[];
  loading?: boolean;
  onEdit?: (vehicle: VehicleUI) => void;
  onDelete?: (vehicle: VehicleUI) => void;
  onAssign?: (vehicle: VehicleUI) => void;
  onView?: (vehicle: VehicleUI) => void;
  onBulkAction?: (action: string, vehicles: VehicleUI[]) => void;
  className?: string;
}

export function VehicleCardGrid({
  vehicles,
  loading = false,
  onEdit,
  onDelete,
  onAssign,
  onView,
  onBulkAction,
  className = ''
}: VehicleCardGridProps) {
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());

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
    if (selectedVehicles.size === vehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(vehicles.map(v => v.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    const selectedVehicleObjects = vehicles.filter(v => selectedVehicles.has(v.id));
    if (onBulkAction) {
      onBulkAction(action, selectedVehicleObjects);
    }
    setSelectedVehicles(new Set()); // Clear selection after action
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
                {selectedVehicles.size === vehicles.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>
                  {selectedVehicles.size === vehicles.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
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
      {vehicles.length === 0 ? (
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
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence>
            {vehicles.map((vehicle) => (
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








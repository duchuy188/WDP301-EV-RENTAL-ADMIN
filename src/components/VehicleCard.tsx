import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BatteryIndicator } from './ui/battery-indicator';
import type { VehicleUI, VehicleStatus, VehicleType } from './service/type/vehicleTypes';

interface VehicleCardProps {
  vehicle: VehicleUI;
  onEdit?: (vehicle: VehicleUI) => void;
  onDelete?: (vehicle: VehicleUI) => void;
  onAssign?: (vehicle: VehicleUI) => void;
  onView?: (vehicle: VehicleUI) => void;
  isSelected?: boolean;
  onSelect?: (vehicle: VehicleUI, selected: boolean) => void;
  className?: string;
}

const getStatusConfig = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return {
        label: 'Sẵn sàng',
        color: 'bg-green-500',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        icon: CheckCircle
      };
    case 'rented':
      return {
        label: 'Đang thuê',
        color: 'bg-blue-500',
        textColor: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        icon: Users
      };
    case 'maintenance':
      return {
        label: 'Bảo trì',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
        icon: Wrench
      };
    case 'broken':
      return {
        label: 'Hỏng',
        color: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        icon: AlertTriangle
      };
    default:
      return {
        label: 'Không xác định',
        color: 'bg-gray-500',
        textColor: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-800',
        icon: Clock
      };
  }
};

const getTypeIcon = (type: VehicleType) => {
  // For now, using generic car icon, can be customized later
  return <Gauge className="w-4 h-4" />;
};

const getVehicleImage = (vehicle: VehicleUI): string => {
  // Return first image if available, otherwise placeholder
  if (vehicle.images && vehicle.images.length > 0) {
    return vehicle.images[0];
  }
  
  // Generate placeholder based on vehicle type and color
  const typeParam = vehicle.type === 'motorcycle' ? 'motorcycle' : 'scooter';
  const colorParam = vehicle.color.toLowerCase().replace(/\s+/g, '-');
  
  // Using placeholder service (can be replaced with actual image service)
  return `https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=${vehicle.brand}+${vehicle.model}`;
};

export function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
  onAssign,
  onView,
  isSelected = false,
  onSelect,
  className = ''
}: VehicleCardProps) {
  const statusConfig = getStatusConfig(vehicle.status);
  const StatusIcon = statusConfig.icon;

  const handleCardClick = () => {
    if (onView) {
      onView(vehicle);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(vehicle, e.target.checked);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`group ${className}`}
    >
      <Card 
        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl border-0 shadow-md ${
          isSelected 
            ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl' 
            : 'hover:shadow-xl'
        }`}
        onClick={handleCardClick}
      >
        {/* Vehicle Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <img
            src={getVehicleImage(vehicle)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              // Fallback to colored placeholder
              e.currentTarget.src = `https://via.placeholder.com/300x200/${vehicle.color === 'red' ? 'EF4444' : vehicle.color === 'blue' ? '3B82F6' : vehicle.color === 'green' ? '10B981' : '6B7280'}/FFFFFF?text=${vehicle.brand}+${vehicle.model}`;
            }}
          />
          
          {/* Status Overlay */}
          <div className="absolute top-3 left-3 z-10">
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${statusConfig.bgColor} backdrop-blur-md shadow-lg border border-white/20`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse`} />
              <span className={`text-xs font-semibold ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Selection Checkbox */}
          {onSelect && (
            <div className="absolute top-3 right-3 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectChange}
                className="w-5 h-5 text-blue-600 bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:ring-2 cursor-pointer shadow-lg"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Chọn xe ${vehicle.brand} ${vehicle.model}`}
                title={`Chọn xe ${vehicle.brand} ${vehicle.model}`}
              />
            </div>
          )}

          {/* Battery Level Overlay */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-white/10">
              <BatteryIndicator 
                level={vehicle.batteryLevel} 
                size="sm"
                showPercentage={true}
                className="text-white"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <div className="flex space-x-2">
              {onView && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 w-9 p-0 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(vehicle);
                  }}
                  title="Xem chi tiết"
                >
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 w-9 p-0 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(vehicle);
                  }}
                  title="Chỉnh sửa"
                >
                  <Edit className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          {/* Vehicle Info Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                {vehicle.brand} {vehicle.model}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono font-semibold text-gray-700 dark:text-gray-200">
                  {vehicle.licensePlate}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">• {vehicle.year}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                {getTypeIcon(vehicle.type)}
              </div>
            </div>
          </div>

          {/* Vehicle Stats */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {vehicle.year}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  vehicle.color === 'red' ? 'bg-red-500' :
                  vehicle.color === 'blue' ? 'bg-blue-500' :
                  vehicle.color === 'green' ? 'bg-green-500' :
                  vehicle.color === 'yellow' ? 'bg-yellow-500' :
                  vehicle.color === 'black' ? 'bg-gray-900' :
                  vehicle.color === 'white' ? 'bg-gray-100 border border-gray-300' :
                  'bg-gray-400'
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {vehicle.color}
              </span>
            </div>
          </div>

          {/* Technical Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dung lượng pin:</span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{vehicle.batteryCapacity}kWh</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tầm xa:</span>
              </div>
              <span className="font-semibold text-green-600 dark:text-green-400">{vehicle.maxRange}km</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Giá thuê:</span>
              <span className="font-bold text-base text-amber-700 dark:text-amber-300">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(vehicle.pricePerDay)}/ngày
              </span>
            </div>
          </div>

          {/* Station Info */}
          {vehicle.stationName && (
            <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Vị trí hiện tại</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {vehicle.stationName}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {onAssign && vehicle.status === 'available' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-all font-medium dark:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(vehicle);
                }}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Phân bổ
              </Button>
            )}
            
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all font-medium dark:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(vehicle);
                }}
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Sửa
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="px-3 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                // Show more options menu
              }}
              title="Thêm tùy chọn"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

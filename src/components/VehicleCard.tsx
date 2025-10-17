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
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        icon: CheckCircle
      };
    case 'rented':
      return {
        label: 'Đang thuê',
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        icon: Users
      };
    case 'maintenance':
      return {
        label: 'Bảo trì',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        icon: Wrench
      };
    case 'broken':
      return {
        label: 'Hỏng',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        icon: AlertTriangle
      };
    default:
      return {
        label: 'Không xác định',
        color: 'bg-gray-500',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50',
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
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group ${className}`}
    >
      <Card 
        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
          isSelected 
            ? 'border-blue-500 shadow-lg' 
            : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
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
          <div className="absolute top-3 left-3">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusConfig.bgColor} backdrop-blur-sm`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
              <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Selection Checkbox */}
          {onSelect && (
            <div className="absolute top-3 right-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectChange}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Chọn xe ${vehicle.brand} ${vehicle.model}`}
                title={`Chọn xe ${vehicle.brand} ${vehicle.model}`}
              />
            </div>
          )}

          {/* Battery Level Overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
              <BatteryIndicator 
                level={vehicle.batteryLevel} 
                size="sm"
                showPercentage={true}
                className="text-white"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex space-x-1">
              {onView && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(vehicle);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(vehicle);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Vehicle Info Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {vehicle.licensePlate}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {getTypeIcon(vehicle.type)}
              <Badge variant="outline" className="text-xs">
                {vehicle.type === 'motorcycle' ? 'Mô tô' : 'Xe máy'}
              </Badge>
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
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Dung lượng pin:</span>
              <span className="font-medium">{vehicle.batteryCapacity}kWh</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tầm xa:</span>
              <span className="font-medium">{vehicle.maxRange}km</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Giá thuê:</span>
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(vehicle.pricePerDay)}/ngày
              </span>
            </div>
          </div>

          {/* Station Info */}
          {vehicle.stationName && (
            <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {vehicle.stationName}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {onAssign && vehicle.status === 'available' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(vehicle);
                }}
              >
                <Users className="w-4 h-4 mr-1" />
                Phân bổ
              </Button>
            )}
            
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(vehicle);
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Sửa
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="px-2"
              onClick={(e) => {
                e.stopPropagation();
                // Show more options menu
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

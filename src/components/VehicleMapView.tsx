import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Zap, 
  Car,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BatteryIndicator } from './ui/battery-indicator';
import type { VehicleUI, VehicleStatus } from './service/type/vehicleTypes';

interface VehicleMapViewProps {
  vehicles: VehicleUI[];
  loading?: boolean;
  onVehicleClick?: (vehicle: VehicleUI) => void;
  className?: string;
}

// Mock coordinates for demo - in real app, these would come from API
const getVehicleCoordinates = (vehicle: VehicleUI) => {
  // Generate consistent coordinates based on vehicle ID
  const hash = vehicle.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Ho Chi Minh City bounds
  const lat = 10.7500 + (Math.abs(hash % 1000) / 10000); // 10.75 - 10.85
  const lng = 106.6500 + (Math.abs((hash * 7) % 1000) / 10000); // 106.65 - 106.75
  
  return { lat, lng };
};

const getStatusColor = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return '#10B981'; // green
    case 'rented': return '#3B82F6'; // blue
    case 'maintenance': return '#F59E0B'; // yellow
    case 'broken': return '#EF4444'; // red
    default: return '#6B7280'; // gray
  }
};

export function VehicleMapView({ 
  vehicles, 
  loading = false, 
  onVehicleClick,
  className = '' 
}: VehicleMapViewProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleUI | null>(null);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter] = useState({ lat: 10.8, lng: 106.7 });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => 
      statusFilter === 'all' || vehicle.status === statusFilter
    );
  }, [vehicles, statusFilter]);

  const vehiclesByStatus = useMemo(() => {
    const groups = {
      available: vehicles.filter(v => v.status === 'available').length,
      rented: vehicles.filter(v => v.status === 'rented').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      broken: vehicles.filter(v => v.status === 'broken').length,
    };
    return groups;
  }, [vehicles]);

  const handleVehicleClick = (vehicle: VehicleUI) => {
    setSelectedVehicle(vehicle);
    if (onVehicleClick) {
      onVehicleClick(vehicle);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Bản đồ xe</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Đang tải bản đồ...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Bản đồ xe ({filteredVehicles.length})</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-2 mt-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="text-xs"
              >
                Tất cả ({vehicles.length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'available' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('available')}
                className={`text-xs ${statusFilter === 'available' ? 'bg-green-500 text-white border-green-500' : 'border-green-500'}`}
              >
                Sẵn sàng ({vehiclesByStatus.available})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'rented' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rented')}
                className={`text-xs ${statusFilter === 'rented' ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-500'}`}
              >
                Đang thuê ({vehiclesByStatus.rented})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'maintenance' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('maintenance')}
                className={`text-xs ${statusFilter === 'maintenance' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-yellow-500'}`}
              >
                Bảo trì ({vehiclesByStatus.maintenance})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'broken' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('broken')}
                className={`text-xs ${statusFilter === 'broken' ? 'bg-red-500 text-white border-red-500' : 'border-red-500'}`}
              >
                Hỏng ({vehiclesByStatus.broken})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative">
            {/* Mock Map Container */}
            <div 
              className={`bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden ${
                isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
              }`}
            >
              {/* Map Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Vehicle Markers */}
              {filteredVehicles.map((vehicle) => {
                const coords = getVehicleCoordinates(vehicle);
                const x = ((coords.lng - 106.65) / 0.1) * 100; // Convert to percentage
                const y = ((coords.lat - 10.75) / 0.1) * 100;
                
                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2 }}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{ 
                      left: `${Math.min(Math.max(x, 5), 95)}%`, 
                      top: `${Math.min(Math.max(y, 5), 95)}%` 
                    }}
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    <div className="relative">
                      {/* Vehicle Marker */}
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                        style={{ backgroundColor: getStatusColor(vehicle.status) }}
                      >
                        <Car className="w-3 h-3 text-white" />
                      </div>
                      
                      {/* Battery Level Indicator */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: vehicle.batteryLevel > 50 ? '#10B981' : 
                                           vehicle.batteryLevel > 20 ? '#F59E0B' : '#EF4444'
                          }}
                        />
                      </div>

                      {/* Pulse Animation for Selected */}
                      {selectedVehicle?.id === vehicle.id && (
                        <div 
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{ backgroundColor: getStatusColor(vehicle.status) }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Map Center Indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Navigation className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Vehicle Detail Panel */}
            {selectedVehicle && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {selectedVehicle.licensePlate}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trạng thái:</span>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(selectedVehicle.status),
                        color: 'white'
                      }}
                    >
                      {selectedVehicle.status === 'available' ? 'Sẵn sàng' :
                       selectedVehicle.status === 'rented' ? 'Đang thuê' :
                       selectedVehicle.status === 'maintenance' ? 'Bảo trì' : 'Hỏng'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pin:</span>
                    <BatteryIndicator level={selectedVehicle.batteryLevel} size="sm" showPercentage />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Vị trí:</span>
                    <span className="text-sm font-medium">
                      {selectedVehicle.stationName || 'Chưa phân bổ'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Giá thuê:</span>
                    <span className="text-sm font-medium text-green-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(selectedVehicle.pricePerDay)}/ngày
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onVehicleClick?.(selectedVehicle)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Chú thích</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Sẵn sàng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Đang thuê</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Bảo trì</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Hỏng</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

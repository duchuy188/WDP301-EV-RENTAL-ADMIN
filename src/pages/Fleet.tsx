import React from 'react';
import { motion } from 'framer-motion';
import { Car, Battery, MapPin, Wrench } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage, Vehicle, Station } from '@/lib/storage';

export function Fleet() {
  const vehicles = storage.getVehicles();
  const stations = storage.getStations();

  const vehicleColumns = [
    {
      key: 'model',
      header: 'Model xe',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Car className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'battery',
      header: 'Pin (%)',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-green-500" />
          <span>{value}%</span>
          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value: string) => (
        <Badge variant={
          value === 'available' ? 'success' : 
          value === 'rented' ? 'warning' : 'destructive'
        }>
          {value === 'available' ? 'Sẵn sàng' :
           value === 'rented' ? 'Đang thuê' : 'Bảo trì'}
        </Badge>
      )
    },
    {
      key: 'location',
      header: 'Vị trí',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'lastRent',
      header: 'Lần thuê cuối',
      render: (value: string) => value || 'Chưa thuê'
    }
  ];

  const stationColumns = [
    {
      key: 'name',
      header: 'Tên điểm thuê'
    },
    {
      key: 'address',
      header: 'Địa chỉ'
    },
    {
      key: 'availableVehicles',
      header: 'Xe sẵn có',
      render: (value: number) => (
        <span className="font-medium text-green-600">{value}</span>
      )
    },
    {
      key: 'rentedVehicles',
      header: 'Xe đã đặt',
      render: (value: number) => (
        <span className="font-medium text-yellow-600">{value}</span>
      )
    },
    {
      key: 'maintenanceVehicles',
      header: 'Xe bảo trì',
      render: (value: number) => (
        <span className="font-medium text-red-600">{value}</span>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý đội xe & điểm thuê
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theo dõi và quản lý toàn bộ đội xe và các điểm thuê
        </p>
      </motion.div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Xe sẵn sàng
              </CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.status === 'available').length}
              </div>
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
                Xe đang thuê
              </CardTitle>
              <Car className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {vehicles.filter(v => v.status === 'rented').length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Xe bảo trì
              </CardTitle>
              <Wrench className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stations Table */}
      <DataTable
        title="Danh sách điểm thuê"
        columns={stationColumns}
        data={stations}
      />

      {/* Vehicles Table */}
      <DataTable
        title="Danh sách xe"
        columns={vehicleColumns}
        data={vehicles}
      />
    </div>
  );
}
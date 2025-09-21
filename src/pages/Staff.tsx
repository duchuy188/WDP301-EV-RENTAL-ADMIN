import React from 'react';
import { motion } from 'framer-motion';
import { UserCog, MapPin, Star, Activity } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';

export function Staff() {
  const staff = storage.getStaff();

  const columns = [
    {
      key: 'name',
      header: 'Tên nhân viên',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <UserCog className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'station',
      header: 'Điểm thuê',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'deliveries',
      header: 'Lượt giao/nhận',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-green-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Đánh giá TB',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value === 'active' ? 'Đang làm việc' : 'Nghỉ'}
        </Badge>
      )
    }
  ];

  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'active').length;
  const averageRating = (staff.reduce((sum, s) => sum + s.rating, 0) / staff.length).toFixed(1);
  const totalDeliveries = staff.reduce((sum, s) => sum + s.deliveries, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý nhân viên
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theo dõi hiệu suất và quản lý đội ngũ nhân viên
        </p>
      </motion.div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng nhân viên
              </CardTitle>
              <UserCog className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalStaff}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang làm việc
              </CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeStaff}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đánh giá TB
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {averageRating}⭐
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng giao/nhận
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalDeliveries}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Staff Table */}
      <DataTable
        title="Danh sách nhân viên"
        columns={columns}
        data={staff}
      />
    </div>
  );
}